---
title: "Intermediate"
weight: 10000002
date: 2026-03-25T00:00:00+07:00
draft: false
description: "Master Zod production patterns through 27 annotated examples covering refinements, transforms, discriminated unions, recursive schemas, error formatting, schema composition, and API validation"
tags: ["zod", "typescript", "validation", "schema", "tutorial", "by-example", "intermediate"]
---

This intermediate tutorial covers Zod production patterns through 27 heavily annotated examples. Each example assumes you understand beginner concepts (primitives, objects, arrays, parse methods, type inference).

## Prerequisites

Before starting, ensure you understand:

- Zod beginner examples (Examples 1-28)
- TypeScript generics and utility types
- Async/await patterns
- REST API concepts (request/response bodies)

## Group 1: Refinements and Custom Validation

### Example 29: Basic Refinement with .refine()

`.refine()` adds custom validation logic beyond Zod's built-in validators. The refinement function receives the parsed value and returns a boolean.

```typescript
import { z } from "zod";

// Custom validation: password strength
const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  // => Built-in: length >= 8
  .refine(
    (password) => /[A-Z]/.test(password),
    // => Custom validation: at least one uppercase letter
    "Password must contain at least one uppercase letter",
    // => Error message when refinement returns false
  )
  .refine(
    (password) => /[0-9]/.test(password),
    // => Custom validation: at least one digit
    "Password must contain at least one digit",
  );

const validPassword = PasswordSchema.parse("SecurePass1");
// => "SecurePass1" passes all refinements
// => validPassword = "SecurePass1"

try {
  PasswordSchema.parse("weakpass");
  // => No uppercase, no digit — fails both refinements
} catch (error) {
  console.log("Weak password rejected");
  // => Output: Weak password rejected
  // => ZodError.issues contains messages for each failed refinement
}

// Cross-field validation with .refine() on object
const PasswordConfirmSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    // => data has both fields — compare them
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
      // => path: specifies which field the error attaches to
    },
  );
```

**Key Takeaway**: `.refine(validatorFn, message)` adds custom boolean validation after built-in checks. For cross-field validation, apply `.refine()` to the entire object schema.

**Why It Matters**: Built-in validators cover formats and ranges, but business rules often require custom logic: passwords meeting complexity requirements, usernames being unique, dates being in the future, or one field depending on another. `.refine()` is the escape hatch that makes any custom rule expressible within Zod's composable validation system. The `path` option in the options object is crucial for form validation — it tells your UI which field to highlight when cross-field validation fails.

---

### Example 30: superRefine for Multiple Errors

`.superRefine()` receives a `ctx` (context) object that lets you add multiple validation issues within a single refinement, providing granular error control.

```typescript
import { z } from "zod";

// superRefine for multiple custom errors
const RegisterSchema = z
  .object({
    username: z.string(),
    password: z.string(),
    email: z.string(),
  })
  .superRefine((data, ctx) => {
    // => ctx.addIssue adds a validation issue without stopping validation
    // => Multiple issues can be added in one superRefine

    // Check username length
    if (data.username.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        // => code: standard ZodIssueCode for better integration
        minimum: 3,
        type: "string",
        inclusive: true,
        message: "Username must be at least 3 characters",
        path: ["username"],
        // => path: attaches error to username field
      });
    }

    // Check password contains digit
    if (!/\d/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        // => code.custom for non-standard validations
        message: "Password must contain at least one digit",
        path: ["password"],
        // => Error attaches to password field
      });
    }

    // Check email domain restriction
    if (!data.email.endsWith("@company.com")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must use company email",
        path: ["email"],
        // => Error attaches to email field
      });
    }
    // => If no issues added, validation passes
  });

const result = RegisterSchema.safeParse({
  username: "ab",
  password: "nodigit",
  email: "user@gmail.com",
});
// => result.success = false
// => result.error.issues contains 3 separate errors (one per field)
```

**Key Takeaway**: `.superRefine()` gives full control over error generation. Use it when you need multiple errors from one validation function or need to use standard `ZodIssueCode` values for framework integration.

**Why It Matters**: Form validation must show all errors simultaneously, not sequentially. With `.refine()`, each refinement is independent — but `.superRefine()` lets you batch multiple checks and report all failures at once. This matches user expectations: submit a form, see all errors at once, fix them all, submit again. The `ZodIssueCode` standard codes also integrate correctly with form libraries and i18n systems that map error codes to translated messages.

---

### Example 31: Transform Values

`.transform()` modifies the parsed value after validation. The output type can differ from the input type, creating a transformation pipeline.

```typescript
import { z } from "zod";

// Simple transform: uppercase string
const UpperCaseSchema = z.string().transform((str) => str.toUpperCase());
// => Input type: string
// => Output type: string (same, but value modified)

const result = UpperCaseSchema.parse("hello");
// => result = "HELLO"
// => type: string

// Type-changing transform: string to number
const NumericStringSchema = z
  .string()
  .regex(/^\d+$/, "Must be numeric")
  // => Built-in validation: only digits allowed
  .transform((str) => parseInt(str, 10));
// => Transform: convert to integer after validation
// => Input type: string; Output type: number

type NumericStringOutput = z.infer<typeof NumericStringSchema>;
// => NumericStringOutput = number (output after transform)
// => z.input<typeof NumericStringSchema> = string (input before transform)

const num = NumericStringSchema.parse("42");
// => num = 42 (type: number)
// => Input "42" passed validation (only digits), then converted to 42

// Object transform: reshape data
const ApiUserSchema = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    // => Snake_case from API
  })
  .transform((data) => ({
    firstName: data.first_name,
    lastName: data.last_name,
    fullName: `${data.first_name} ${data.last_name}`,
    // => Transform to camelCase with added computed field
  }));

type User = z.infer<typeof ApiUserSchema>;
// => { firstName: string; lastName: string; fullName: string }

const user = ApiUserSchema.parse({ first_name: "Aisha", last_name: "Rahman" });
// => user = { firstName: "Aisha", lastName: "Rahman", fullName: "Aisha Rahman" }
```

**Key Takeaway**: `.transform()` converts validated values to new shapes. `z.infer<>` returns the output type; `z.input<>` returns the input type before transformation.

**Why It Matters**: APIs frequently send data in formats that differ from your application's domain model — snake_case vs camelCase, Unix timestamps vs Date objects, string IDs vs numbers. `.transform()` co-locates data normalization with validation, ensuring you always work with the correct format after parsing. This pattern eliminates the separate "parse then transform" step that frequently introduces bugs when one is updated without the other.

---

### Example 32: Preprocess

`z.preprocess()` runs a function BEFORE validation, converting raw input into a form that the schema can validate. Essential for type coercion from strings.

```typescript
import { z } from "zod";

// Preprocess: string to number before number validation
const CoercedNumberSchema = z.preprocess(
  (input) => {
    // => Preprocessing runs BEFORE the schema validates
    if (typeof input === "string") {
      return parseFloat(input);
      // => Convert string to number
    }
    return input;
    // => Pass through non-strings unchanged
  },
  z.number().min(0),
  // => The actual schema — validates the preprocessed value
);

const fromString = CoercedNumberSchema.parse("42.5");
// => Preprocess: "42.5" → 42.5 (float)
// => Validation: 42.5 >= 0 (passes)
// => fromString = 42.5 (type: number)

const fromNumber = CoercedNumberSchema.parse(15);
// => Preprocess: 15 → 15 (passthrough)
// => Validation: 15 >= 0 (passes)
// => fromNumber = 15 (type: number)

// Note: z.coerce handles common type coercions automatically
const SimpleCoercedSchema = z.coerce.number().min(0);
// => z.coerce.number() wraps Number() constructor as preprocessor
// => Equivalent to above for string-to-number coercion
// => Prefer z.coerce.* for common coercions — see Example 35

// Date preprocessing from ISO string
const DateFromStringSchema = z.preprocess(
  (input) => (typeof input === "string" ? new Date(input) : input),
  // => Convert ISO string to Date object
  z.date(),
  // => Validate the Date object
);

const date = DateFromStringSchema.parse("2026-03-25");
// => Preprocess: "2026-03-25" → new Date("2026-03-25")
// => Validation: valid Date (passes)
// => date = Date object for 2026-03-25
```

**Key Takeaway**: `z.preprocess(fn, schema)` transforms raw input before validation runs. Use it for type coercion, data normalization, or handling multiple valid input formats for one schema.

**Why It Matters**: Environment variables are strings, query parameters are strings, JSON dates are strings. Without preprocessing, validating these common data sources requires maintaining separate "coerce then validate" pipelines. `z.preprocess()` makes coercion part of the schema definition, ensuring consistent input handling wherever the schema is used. For the most common coercions (string → number, string → boolean, string → Date), use `z.coerce.*` which provides standardized preprocessing without manual implementation.

---

### Example 33: Pipeline with .pipe()

`.pipe()` chains schemas where the output of one feeds into the input of the next. It's the explicit pipeline operator for schema composition.

```typescript
import { z } from "zod";

// Pipe: string → coerce to number → validate range
const PageNumberSchema = z
  .string()
  // => Stage 1: accept string input
  .transform((s) => parseInt(s, 10))
  // => Stage 2: convert string to integer
  .pipe(z.number().int().min(1).max(1000));
// => Stage 3: validate converted number is 1-1000
// => .pipe() connects schemas: output of step 2 is input of step 3

const page = PageNumberSchema.parse("5");
// => "5" → 5 → validated 5 (in range 1-1000)
// => page = 5 (type: number)

try {
  PageNumberSchema.parse("0");
  // => "0" → 0 → fails min(1) validation
} catch (error) {
  console.log("Page 0 rejected");
  // => Output: Page 0 rejected
}

try {
  PageNumberSchema.parse("abc");
  // => "abc" → NaN → NaN fails z.number() validation
} catch (error) {
  console.log("Non-numeric string rejected");
  // => Output: Non-numeric string rejected
}

// Type tracking through pipeline
type PageInput = z.input<typeof PageNumberSchema>;
// => PageInput = string (input type at start of pipe)

type PageOutput = z.output<typeof PageNumberSchema>;
// => PageOutput = number (output type at end of pipe)
// => Equivalent to z.infer<typeof PageNumberSchema>
```

**Key Takeaway**: `.pipe(schema)` chains schemas sequentially — the validated/transformed output of the first becomes the input to the second. Use for multi-stage parsing with type-safe intermediate values.

**Why It Matters**: Complex data transformations often require multiple stages: normalize the format, validate the structure, transform to domain objects. `.pipe()` makes this multi-stage pipeline explicit and type-safe. Each stage has verified input and output types, preventing the common bug of later stages receiving incorrect types from earlier transformations. The clear separation of stages also makes debugging easier — you can identify exactly which stage of the pipeline a value failed.

---

## Group 2: Advanced Schema Patterns

### Example 34: Discriminated Union

`z.discriminatedUnion()` optimizes union validation by using a literal discriminant field to select which variant to validate. More efficient and provides better errors than `z.union()`.

```typescript
import { z } from "zod";

// Define discriminated union variants
const SuccessSchema = z.object({
  status: z.literal("success"),
  // => Discriminant: "success" identifies this variant
  data: z.object({
    userId: z.string().uuid(),
    token: z.string(),
  }),
  // => Success-specific fields
});

const ErrorSchema = z.object({
  status: z.literal("error"),
  // => Discriminant: "error" identifies this variant
  code: z.number().int(),
  // => Error code
  message: z.string(),
  // => Error message — error-specific field
});

const LoadingSchema = z.object({
  status: z.literal("loading"),
  // => Discriminant: "loading" identifies this variant
  progress: z.number().min(0).max(100).optional(),
  // => Optional progress percentage
});

// Discriminated union using "status" as discriminant
const ApiResponseSchema = z.discriminatedUnion("status", [SuccessSchema, ErrorSchema, LoadingSchema]);
// => First arg: discriminant field name (must be z.literal in each variant)
// => Second arg: array of object schemas, each with the discriminant field

type ApiResponse = z.infer<typeof ApiResponseSchema>;
// => ApiResponse = SuccessSchema | ErrorSchema | LoadingSchema type union

const response = ApiResponseSchema.parse({
  status: "success",
  data: { userId: "550e8400-e29b-41d4-a716-446655440000", token: "abc" },
});
// => Zod reads status: "success" → validates against SuccessSchema only
// => More efficient than z.union (no trial-and-error through all variants)

// Type narrowing with discriminant
if (response.status === "success") {
  console.log(response.data.token);
  // => TypeScript narrows response to SuccessSchema type
  // => response.data is accessible here (not in error/loading variants)
}
```

**Key Takeaway**: `z.discriminatedUnion(field, variants)` uses a literal discriminant field to select which schema validates the input. Faster than `z.union()` and produces precise error messages pointing to the correct variant.

**Why It Matters**: API responses, Redux actions, and state machines commonly use discriminated unions. The `status`, `type`, or `kind` field identifies the shape. `z.discriminatedUnion()` avoids the performance cost of trying each union variant sequentially — it jumps directly to the matching variant. More importantly, error messages become targeted: instead of "none of the union variants matched," you get errors specific to the variant you intended. This is the primary pattern for validating typed event streams and command/event sourcing payloads.

---

### Example 35: Coercion with z.coerce

`z.coerce.*` schemas automatically convert input types before validation — strings to numbers, strings to booleans, strings to dates. Essential for form data and query parameters.

```typescript
import { z } from "zod";

// Coerce string to number
const NumberSchema = z.coerce.number();
// => Wraps Number() constructor as preprocessor
// => "42" → 42, "3.14" → 3.14, true → 1

const fromString = NumberSchema.parse("42");
// => fromString = 42 (type: number)

const fromBoolean = NumberSchema.parse(true);
// => true → 1 (JavaScript Number(true) === 1)
// => fromBoolean = 1 (type: number)

// Coerce string to boolean
const BooleanSchema = z.coerce.boolean();
// => Wraps Boolean() constructor
// => Anything truthy → true, falsy → false

const fromOne = BooleanSchema.parse(1);
// => fromOne = true

const fromZero = BooleanSchema.parse(0);
// => fromZero = false

const fromString2 = BooleanSchema.parse("false");
// => Non-empty string is truthy in JS
// => fromString2 = true (surprising! use z.preprocess for strict string-to-bool)

// Coerce string to Date
const DateSchema = z.coerce.date();
// => Wraps new Date() constructor
// => "2026-03-25" → Date object
// => 1711324800000 → Date from timestamp

const dateFromString = DateSchema.parse("2026-03-25");
// => dateFromString = Date object for 2026-03-25
// => type: Date

// URL query parameter schema with coercion
const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  // => Query "?page=2" → page: 2 (string "2" → number 2)
  limit: z.coerce.number().int().positive().max(100).default(20),
  // => Query "?limit=50" → limit: 50
  active: z.coerce.boolean().optional(),
  // => Query "?active=1" → active: true
});
```

**Key Takeaway**: `z.coerce.*` automatically converts common type mismatches before validation. Use for query parameters, form data, and any context where data arrives as strings but your schema expects specific types.

**Why It Matters**: HTTP query parameters and HTML form submissions are inherently strings. Without coercion, you'd either validate everything as strings (losing type safety) or manually parse each parameter before validation (duplicating effort). `z.coerce.*` bridges the string-everything nature of HTTP with typed domain models. The `z.coerce.date()` schema is particularly valuable, eliminating the ubiquitous "string to Date" conversion that every application handles differently, often incorrectly.

---

### Example 36: Recursive Schemas with z.lazy()

`z.lazy()` defers schema evaluation to break circular references. Essential for recursive data structures like trees and nested comments.

```typescript
import { z } from "zod";

// Define the interface first for TypeScript
interface Category {
  id: string;
  name: string;
  children: Category[];
  // => Children are also Category objects — recursive
}

// Recursive Zod schema using z.lazy()
const CategorySchema: z.ZodType<Category> = z.object({
  // => Type annotation required: TypeScript can't infer recursive type
  id: z.string().uuid(),
  // => UUID identifier
  name: z.string().min(1),
  // => Category name
  children: z.lazy(() => z.array(CategorySchema)),
  // => z.lazy() defers evaluation until parse time
  // => Breaks the circular reference: CategorySchema references itself
});

// Validate nested category tree
const categoryTree = CategorySchema.parse({
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Electronics",
  children: [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Phones",
      children: [
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          name: "Smartphones",
          children: [],
          // => Leaf node: empty children array
        },
      ],
    },
  ],
});
// => Full recursive validation passes
// => categoryTree.children[0].children[0].name = "Smartphones"

console.log(categoryTree.children[0].name);
// => Output: Phones
```

**Key Takeaway**: `z.lazy(() => schema)` defers schema evaluation to break circular references in recursive data structures. Provide explicit TypeScript type annotation to help type inference.

**Why It Matters**: Tree structures are pervasive in real applications — file systems, organizational hierarchies, comment threads, menu structures, category taxonomies. Without `z.lazy()`, Zod schemas for recursive structures cause TypeScript's type checker to enter infinite recursion. The lazy evaluation pattern defers resolution to parse time, enabling arbitrarily deep recursive validation while maintaining full type safety. The explicit `z.ZodType<T>` annotation is the required trade-off for TypeScript to handle the recursive type.

---

### Example 37: Custom Error Messages

Every Zod validator accepts a custom error message or message object. This enables user-facing validation messages without post-processing.

```typescript
import { z } from "zod";

// Custom error message as string
const NameSchema = z
  .string({
    required_error: "Name is required",
    // => Message when input is undefined/null
    invalid_type_error: "Name must be a string",
    // => Message when input has wrong type (number, boolean, etc.)
  })
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name cannot exceed 50 characters");
// => Method-level: custom message replaces default

// Field-level custom messages in object
const LoginSchema = z.object({
  email: z
    .string({
      required_error: "Email address is required",
    })
    .email("Please enter a valid email address"),
  // => .email("...") replaces default "Invalid email" message

  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters long"),
  // => .min(8, "...") replaces default length message
});

const result = LoginSchema.safeParse({ email: "not-email", password: "short" });
// => result.success = false

if (!result.success) {
  result.error.issues.forEach((issue) => {
    console.log(`${issue.path.join(".")}: ${issue.message}`);
    // => Each issue has path and custom message
  });
  // => Output: email: Please enter a valid email address
  // => Output: password: Password must be at least 8 characters long
}

// Object-level message for required fields
const result2 = LoginSchema.safeParse({});
// => Both fields missing

if (!result2.success) {
  console.log(result2.error.issues[0].message);
  // => Output: Email address is required
  // => required_error activates when field is undefined
}
```

**Key Takeaway**: Pass custom error messages as the second argument to validation methods or as `{ required_error, invalid_type_error }` objects to schema constructors.

**Why It Matters**: Default Zod error messages like "Invalid email" are accurate but not user-friendly. Production applications need localized, contextual messages that guide users — "Please enter a valid email address" is more helpful than "Invalid email." Embedding custom messages in schemas keeps validation messages co-located with validation rules, making it easy to review both simultaneously and ensuring custom messages stay synchronized with validation logic when rules change.

---

### Example 38: Error Formatting

Zod provides multiple methods for formatting errors into structures suitable for different consumers — flat maps for form libraries, nested trees for complex objects.

```typescript
import { z } from "zod";

const ProfileSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(0),
  address: z.object({
    city: z.string().min(1),
    // => Nested object field
    country: z.string().length(2),
    // => Must be 2-character country code
  }),
});

const result = ProfileSchema.safeParse({
  name: "A", // => Too short
  age: -1, // => Negative
  address: {
    city: "", // => Empty string
    country: "USA", // => Too long (must be 2 chars)
  },
});

if (!result.success) {
  // Method 1: .flatten() — flat error map (best for form libraries)
  const flat = result.error.flatten();
  // => flat.fieldErrors: { name: [...], age: [...], "address.city": [...] }
  // => flat.formErrors: [] (top-level errors, not field-specific)
  console.log(flat.fieldErrors);
  // => Output: { name: [...], age: [...] }
  // => Note: nested fields are NOT included in fieldErrors (only top-level)

  // Method 2: .format() — nested error tree (best for nested forms)
  const formatted = result.error.format();
  // => Returns nested object mirroring the input shape
  // => Each field has _errors array

  console.log(formatted.address?.city?._errors);
  // => Output: ["String must contain at least 1 character(s)"]
  // => Nested path: formatted.address.city._errors

  // Method 3: .issues — raw issue array
  result.error.issues.forEach((issue) => {
    console.log(issue.path.join("."), "->", issue.message);
    // => "name" -> "String must contain at least 2 character(s)"
    // => "age" -> "Number must be greater than or equal to 0"
    // => "address.city" -> "String must contain at least 1 character(s)"
    // => "address.country" -> "String must contain exactly 2 character(s)"
  });
}
```

**Key Takeaway**: Use `.flatten()` for flat key-value error maps (form libraries), `.format()` for nested error trees (complex nested forms), or `.issues` for raw issue arrays (custom error handling).

**Why It Matters**: Different consumers of validation errors need different shapes. React Hook Form expects flat field-name-to-errors maps. Nested form UIs with expandable sections need hierarchical error trees. Custom error rendering might need raw issue arrays. Zod provides all three formats, letting you pick the right tool for each consumer without reformatting errors manually. This flexibility eliminates the adapter code that otherwise mediates between validation libraries and UI frameworks.

---

## Group 3: Schema Composition Methods

### Example 39: Object Schema Methods — merge and extend

`.merge()` combines two object schemas into one. `.extend()` adds new fields to an existing schema. Both produce a new schema without modifying the original.

```typescript
import { z } from "zod";

// Base schema — common entity fields
const TimestampedSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  // => Common audit fields
});

// Product-specific schema
const ProductBaseSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

// merge: combine two schemas (first wins on key conflicts)
const ProductSchema = ProductBaseSchema.merge(TimestampedSchema);
// => ProductSchema has: name, price, createdAt, updatedAt
// => .merge() is equivalent to spreading both objects

type Product = z.infer<typeof ProductSchema>;
// => { name: string; price: number; createdAt: Date; updatedAt: Date }

// extend: add fields to existing schema
const DetailedProductSchema = ProductSchema.extend({
  description: z.string().optional(),
  // => New optional field
  category: z.string(),
  // => New required field
  tags: z.array(z.string()).default([]),
  // => New field with default
});
// => DetailedProductSchema adds 3 fields to ProductSchema
// => Original ProductSchema unchanged

type DetailedProduct = z.infer<typeof DetailedProductSchema>;
// => { name: string; price: number; createdAt: Date; updatedAt: Date;
// =>   description?: string; category: string; tags: string[] }

// extend can also override existing fields
const OverrideSchema = ProductBaseSchema.extend({
  price: z.number().positive().max(10000),
  // => Overrides price with stricter max constraint
});
```

**Key Takeaway**: `.merge(schema)` combines two object schemas; `.extend({ ... })` adds or overrides fields. Both return new schemas — originals are immutable.

**Why It Matters**: Schema composition through merge and extend mirrors TypeScript's `extends` and spread patterns for objects. In practice, most applications have base schemas with common fields (timestamps, IDs, soft-delete) that are extended by domain-specific schemas. The immutability of Zod schemas (both operations return new schemas) means you can safely share and extend base schemas across a codebase without risk of one consumer's extension affecting another's.

---

### Example 40: Object Schema Methods — pick and omit

`.pick()` creates a schema with only selected fields; `.omit()` creates a schema excluding specified fields. Both enable precise sub-schemas without duplication.

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  // => Sensitive field
  name: z.string(),
  createdAt: z.date(),
  role: z.enum(["admin", "user"]),
});

// pick: select only specific fields
const PublicUserSchema = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  // => Only include these 3 fields
  // => password excluded (sensitive), createdAt excluded
});

type PublicUser = z.infer<typeof PublicUserSchema>;
// => PublicUser = { id: string; name: string; email: string }

// omit: exclude specific fields
const CreateUserSchema = UserSchema.omit({
  id: true,
  // => id generated server-side, not provided by client
  createdAt: true,
  // => createdAt set server-side
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;
// => { email: string; password: string; name: string; role: "admin" | "user" }

// Practical: API response vs create input
const userResponse = PublicUserSchema.parse({
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Aisha",
  email: "aisha@example.com",
});
// => password and other fields not required
// => Only id, name, email validated
```

**Key Takeaway**: `.pick({ field: true })` selects fields; `.omit({ field: true })` excludes fields. Both create new schemas that are subsets of the original.

**Why It Matters**: The same entity often needs different shapes for different contexts: public API responses exclude sensitive fields, create operations omit server-generated fields, update operations make all fields optional. Defining these variants through `.pick()` and `.omit()` guarantees they stay synchronized with the source schema — when you add a field to UserSchema, the derived schemas automatically include or exclude it based on their rules, preventing the common bug of forgetting to update one of five related schema definitions.

---

### Example 41: Partial and Required

`.partial()` makes all object fields optional; `.required()` makes all fields required. Pass a set of keys for selective application.

```typescript
import { z } from "zod";

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  bio: z.string(),
  website: z.string().url(),
});

// partial(): all fields become optional
const UpdateUserSchema = UserSchema.partial();
// => UpdateUserSchema: all fields are now optional
// => Equivalent to { name?: string; email?: string; bio?: string; website?: string }

type UpdateUser = z.infer<typeof UpdateUserSchema>;
// => { name?: string; email?: string; bio?: string; website?: string }
// => Useful for PATCH endpoints: send only changed fields

// Selective partial: only some fields become optional
const SelectiveSchema = UserSchema.partial({
  bio: true,
  website: true,
  // => Only bio and website become optional
  // => name and email remain required
});

type SelectiveUpdate = z.infer<typeof SelectiveSchema>;
// => { name: string; email: string; bio?: string; website?: string }

// required(): make optional fields required
const OptionalSchema = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
});

const RequiredSchema = OptionalSchema.required();
// => Both fields now required
// => { name: string; age: number }

// Selective required
const SelectiveRequired = OptionalSchema.required({ name: true });
// => name required, age still optional
// => { name: string; age?: number }
```

**Key Takeaway**: `.partial()` makes fields optional (for PATCH endpoints), `.required()` makes fields required. Both accept an optional key set for selective field modification.

**Why It Matters**: REST API design requires different field optionality per HTTP method: POST requires all fields, PATCH accepts any subset of fields. Deriving `UpdateSchema` from `CreateSchema` using `.partial()` guarantees they have the same fields and validators, just with different optionality. Without this pattern, manually defining update schemas alongside create schemas creates drift — the same email format validation might be updated in one but not the other, causing inconsistent validation behavior across API methods.

---

### Example 42: Schema Validation Methods — keyof and shape

Object schemas expose `.keyof()` to get valid key names and `.shape` to access individual field schemas.

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

// keyof(): schema validating key names
const UserKeySchema = UserSchema.keyof();
// => Returns ZodEnum schema of valid key names
// => Accepts: "id" | "name" | "email" | "role"

type UserKey = z.infer<typeof UserKeySchema>;
// => UserKey = "id" | "name" | "email" | "role"

const validKey = UserKeySchema.parse("name");
// => validKey = "name" (type: "id" | "name" | "email" | "role")

try {
  UserKeySchema.parse("nonexistent");
  // => "nonexistent" not in schema keys — fails
} catch (error) {
  console.log("Invalid field name");
  // => Output: Invalid field name
}

// .shape: access individual field schemas
const nameValidator = UserSchema.shape.name;
// => nameValidator = ZodString schema for the name field

const validName = nameValidator.parse("Aisha");
// => Validates name field in isolation
// => validName = "Aisha"

// Useful for dynamic field validation
function validateField(fieldName: UserKey, value: unknown) {
  const fieldSchema = UserSchema.shape[fieldName];
  // => Access schema for the specific field
  return fieldSchema.safeParse(value);
  // => Validate single field independently
}
```

**Key Takeaway**: `.keyof()` returns a schema of valid field names (enum); `.shape` exposes individual field schemas for targeted single-field validation.

**Why It Matters**: Dynamic form validation validates one field at a time as users type — on-blur validation runs only the touched field's schema, not the full object schema. `.shape` enables this pattern without duplicating validation logic. `.keyof()` is useful for building generic utilities that work with any schema's fields, type-safely constraining the field name argument to valid schema keys. Both are essential for building form libraries and generic validation utilities on top of Zod.

---

## Group 4: Form and API Validation Patterns

### Example 43: Form Validation Pattern

Combine `safeParse()`, `.flatten()`, and TypeScript types for a complete form validation solution without React Hook Form.

```typescript
import { z } from "zod";

// Form schema
const ContactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must consent to proceed" }),
    // => Literal true: checkbox must be checked
  }),
});

type ContactForm = z.infer<typeof ContactFormSchema>;
// => Inferred form data type — use for typed form state

type ContactFormErrors = Partial<Record<keyof ContactForm, string[]>>;
// => Error map type: field name → array of error messages

// Validation function
function validateContactForm(
  data: unknown,
): { success: true; data: ContactForm } | { success: false; errors: ContactFormErrors } {
  const result = ContactFormSchema.safeParse(data);
  // => safeParse: never throws, returns discriminated union

  if (result.success) {
    return { success: true, data: result.data };
    // => Return validated, typed form data
  }

  const errors = result.error.flatten().fieldErrors as ContactFormErrors;
  // => .flatten().fieldErrors: { fieldName: ["error1", "error2"] }
  return { success: false, errors };
  // => Return field-level errors for UI rendering
}

// Usage
const formResult = validateContactForm({
  firstName: "Aisha",
  lastName: "",
  email: "invalid",
  message: "Hi",
  consent: false,
});

if (!formResult.success) {
  console.log(formResult.errors);
  // => { lastName: ["Last name is required"], email: ["Invalid email address"],
  // =>   message: ["Message must be at least 10 characters"],
  // =>   consent: ["You must consent to proceed"] }
}
```

**Key Takeaway**: Combine `safeParse()` + `.flatten()` + typed error shapes for complete form validation. The result type is a discriminated union that TypeScript understands.

**Why It Matters**: Form validation is one of Zod's primary use cases. The pattern of `safeParse → flatten → field errors` maps directly onto every UI framework's error display pattern — each field shows its error messages below the input. Using TypeScript's `keyof` with the schema's inferred type makes the error map type-safe: you can only reference actual field names. This pattern scales from simple contact forms to complex multi-step wizards.

---

### Example 44: API Request Validation

Validate incoming API request bodies with Zod schemas. This pattern works with any Node.js HTTP framework.

```typescript
import { z } from "zod";

// Request body schemas per endpoint
const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name required").max(200),
  price: z.number().positive("Price must be positive"),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  tags: z.array(z.string()).max(10, "Too many tags").default([]),
  stock: z.number().int().nonnegative().default(0),
});

type CreateProductRequest = z.infer<typeof CreateProductSchema>;
// => Typed request body for use in handler logic

// Handler function type (framework-agnostic)
type RequestHandler = (body: unknown) => {
  status: number;
  body: unknown;
};

// Validation middleware pattern
function withValidation<T>(
  schema: z.ZodType<T>,
  handler: (data: T) => { status: number; body: unknown },
): RequestHandler {
  return (rawBody: unknown) => {
    const result = schema.safeParse(rawBody);
    // => Validate raw request body

    if (!result.success) {
      return {
        status: 400,
        // => 400 Bad Request for validation failures
        body: {
          error: "Validation failed",
          issues: result.error.flatten().fieldErrors,
          // => Return structured field errors to client
        },
      };
    }

    return handler(result.data);
    // => Pass validated, typed data to handler
    // => result.data is type T — fully typed
  };
}

// Using the validation wrapper
const createProductHandler = withValidation(CreateProductSchema, (product: CreateProductRequest) => {
  // => product is fully typed CreateProductRequest
  console.log("Creating product:", product.name);
  return { status: 201, body: { id: "new-id", ...product } };
});
```

**Key Takeaway**: Validate API request bodies using `safeParse()` in middleware, returning structured 400 errors for invalid input and passing typed data to handlers.

**Why It Matters**: API endpoints are attack surfaces — users send unexpected, malformed, or malicious data. Validating at the boundary before touching any business logic prevents SQL injection, type coercion errors, and unexpected application states. The middleware pattern keeps validation logic out of handlers, maintaining separation of concerns. Returning structured validation errors (not just "Bad Request") enables API clients to display meaningful error messages to their users, improving the developer experience for API consumers.

---

### Example 45: API Response Validation

Validate external API responses before using them in your application. This protects against API schema changes and undocumented fields.

```typescript
import { z } from "zod";

// Schema for external API response
const GithubUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  // => GitHub username
  name: z.string().nullable(),
  // => Display name — nullable (may not be set)
  email: z.string().email().nullable(),
  // => Email — nullable (may be private)
  public_repos: z.number().int().nonnegative(),
  // => Repository count
  followers: z.number().int().nonnegative(),
  // => Follower count
  created_at: z.string(),
  // => ISO 8601 date string from API
});

type GithubUser = z.infer<typeof GithubUserSchema>;
// => Type reflecting GitHub API response

// Simulate fetching and validating API response
async function fetchGithubUser(username: string): Promise<GithubUser> {
  // => In production: const response = await fetch(`https://api.github.com/users/${username}`)
  // => const rawData = await response.json()

  const rawData = {
    // => Simulated API response
    id: 12345,
    login: "aisha-dev",
    name: "Aisha Rahman",
    email: null,
    // => Private email
    public_repos: 42,
    followers: 100,
    created_at: "2020-01-15T10:00:00Z",
  };

  const result = GithubUserSchema.safeParse(rawData);
  // => Validate against expected schema

  if (!result.success) {
    throw new Error(`GitHub API response changed: ${result.error.message}`);
    // => Alert on unexpected schema changes — prevents silent data corruption
  }

  return result.data;
  // => Return validated, typed GithubUser
}
```

**Key Takeaway**: Validate external API responses with `safeParse()`. Throw explicit errors when schemas don't match — this surfaces API contract violations early rather than letting invalid data silently propagate.

**Why It Matters**: External APIs change without notice. A field that was always a number becomes nullable; a field you depend on is renamed or removed. Without response validation, these changes cause silent bugs — null is passed where a string is expected, `undefined.property` throws deep in business logic, or incorrect data is stored in your database. Validating API responses at the boundary transforms "vague runtime errors from invalid data" into "clear schema violation errors at the API call site," making API changes immediately visible.

---

### Example 46: Environment Variable Validation

Validate environment variables at application startup. Invalid configuration should fail fast with clear messages, not cause mysterious runtime errors.

```typescript
import { z } from "zod";

// Environment variable schema
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  // => Must be one of three values

  PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  // => z.coerce: string env var → number
  // => Valid port range, default 3000

  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
  // => Required database connection URL

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  // => Security: short secrets are vulnerable to brute force

  REDIS_URL: z.string().url().optional(),
  // => Optional cache URL

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  // => Logging level with default
});

type Env = z.infer<typeof EnvSchema>;

// Validate at startup — throws on invalid config
function loadConfig(): Env {
  const result = EnvSchema.safeParse(process.env);
  // => process.env contains all environment variables as strings
  // => z.coerce handles string-to-number conversion for PORT

  if (!result.success) {
    console.error("Invalid environment configuration:");
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
      // => Each line shows which variable is invalid and why
    });
    process.exit(1);
    // => Exit immediately — cannot run with invalid config
  }

  return result.data;
  // => Return typed, validated environment configuration
}

const config = loadConfig();
// => config.PORT is typed as number (not string)
// => config.LOG_LEVEL is typed as "error" | "warn" | "info" | "debug"
// => All fields guaranteed valid or process has exited
```

**Key Takeaway**: Validate `process.env` at startup with `z.coerce` for type conversion. Fail fast with clear error messages rather than letting bad configuration cause cryptic runtime failures.

**Why It Matters**: Missing or malformed environment variables cause some of the most confusing production incidents — applications crash with "Cannot read property 'split' of undefined" instead of "DATABASE_URL is required." Fail-fast validation at startup gives operators clear, immediate feedback about configuration errors before any business logic runs. The `z.coerce` types handle the ubiquitous string-to-type conversion for environment variables, and the typed result object means you never accidentally use an environment variable as a string when you need a number.

---

## Group 5: Advanced Validation Patterns

### Example 47: Branded Types

`.brand()` creates a nominal type wrapper that prevents mixing semantically different strings or numbers even when they have the same underlying type.

```typescript
import { z } from "zod";

// Brand different ID types — all strings, but not interchangeable
const UserIdSchema = z.string().uuid().brand("UserId");
// => .brand("UserId") wraps string in a nominal branded type
// => type: string & z.BRAND<"UserId">

const ProductIdSchema = z.string().uuid().brand("ProductId");
// => Different brand even though same underlying type

type UserId = z.infer<typeof UserIdSchema>;
// => UserId = string & z.BRAND<"UserId">

type ProductId = z.infer<typeof ProductIdSchema>;
// => ProductId = string & z.BRAND<"ProductId">

// Parse to create branded values
const userId = UserIdSchema.parse("550e8400-e29b-41d4-a716-446655440000");
// => userId has type UserId (not just string)

const productId = ProductIdSchema.parse("550e8400-e29b-41d4-a716-446655440001");
// => productId has type ProductId (not just string)

// TypeScript prevents mixing branded types
function deleteUser(id: UserId): void {
  console.log("Deleting user:", id);
  // => Function accepts UserId — not ProductId
}

deleteUser(userId);
// => Correct: userId is UserId type

// TypeScript error — uncomment to see:
// deleteUser(productId);
// => ERROR: Argument of type 'ProductId' is not assignable to parameter of type 'UserId'
// => Prevents accidentally deleting a user with a product ID at compile time

const rawString: string = "550e8400-e29b-41d4-a716-446655440002";
// TypeScript error if you uncomment this:
// deleteUser(rawString);
// => ERROR: raw string cannot be passed as UserId without parsing
```

**Key Takeaway**: `.brand("Tag")` creates nominal types that TypeScript treats as distinct even when the underlying type is identical. Values must be created through the branded schema's `parse()`.

**Why It Matters**: UUID strings for different entities are structurally identical but semantically different. Passing a `ProductId` where a `UserId` is expected is a logic error that TypeScript's structural typing cannot catch. Branded types add nominal identity, making the compiler your safety net against ID confusion — a common source of subtle authorization bugs where the wrong entity is accessed or modified. This pattern is particularly valuable for financial applications where confusing account IDs, transaction IDs, or currency codes leads to severe consequences.

---

### Example 48: Discriminated Union Advanced Pattern

Build complex type-safe event systems and state machines using discriminated unions with rich payloads.

```typescript
import { z } from "zod";

// Event system with discriminated union
const UserCreatedSchema = z.object({
  type: z.literal("USER_CREATED"),
  payload: z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    registeredAt: z.date(),
  }),
});

const UserUpdatedSchema = z.object({
  type: z.literal("USER_UPDATED"),
  payload: z.object({
    userId: z.string().uuid(),
    changes: z.record(z.string(), z.unknown()),
    // => Changes as key-value pairs (field → new value)
  }),
});

const UserDeletedSchema = z.object({
  type: z.literal("USER_DELETED"),
  payload: z.object({
    userId: z.string().uuid(),
    deletedAt: z.date(),
    reason: z.string().optional(),
  }),
});

// All user events as discriminated union
const UserEventSchema = z.discriminatedUnion("type", [UserCreatedSchema, UserUpdatedSchema, UserDeletedSchema]);

type UserEvent = z.infer<typeof UserEventSchema>;
// => UserEvent = UserCreated | UserUpdated | UserDeleted union

// Event handler with exhaustive type checking
function handleUserEvent(event: UserEvent): void {
  switch (event.type) {
    case "USER_CREATED":
      console.log("New user:", event.payload.email);
      // => TypeScript knows payload has email here
      break;
    case "USER_UPDATED":
      console.log("User updated:", event.payload.userId);
      // => TypeScript knows payload has changes here
      break;
    case "USER_DELETED":
      console.log("User deleted:", event.payload.userId);
      // => TypeScript knows payload has deletedAt here
      break;
  }
}
```

**Key Takeaway**: Discriminated unions with rich per-variant payloads enable type-safe event handling where each event type has its own schema. TypeScript's exhaustive checking ensures all variants are handled.

**Why It Matters**: Event-driven architectures, Redux action types, WebSocket messages, and domain events all share this pattern. Without discriminated unions, handling different event types requires type assertions and runtime checks that TypeScript cannot verify. With Zod's discriminated union, each event type is validated against its specific schema at the boundary, and TypeScript's type narrowing ensures your handlers access only the fields that exist for each event type — preventing "property does not exist" errors that are invisible at compile time without this pattern.

---

### Example 49: Schema Composition with .and()

`.and()` creates an intersection inline as a method chain. Combined with `.extend()`, it enables powerful schema layering patterns.

```typescript
import { z } from "zod";

// Reusable concern schemas
const AuditableSchema = z.object({
  createdBy: z.string().uuid(),
  // => Which user created this record
  updatedBy: z.string().uuid(),
  // => Which user last updated this record
});

const SoftDeletableSchema = z.object({
  deletedAt: z.date().nullable(),
  // => null = not deleted; Date = when deleted
  deletedBy: z.string().uuid().nullable(),
  // => null = not deleted; UUID = who deleted it
});

const PaginatedSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
});

// Compose concerns using .and()
const EntitySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .and(AuditableSchema)
  // => Add audit fields
  .and(SoftDeletableSchema);
// => Add soft-delete fields

type Entity = z.infer<typeof EntitySchema>;
// => Entity = { id, name } & { createdBy, updatedBy } & { deletedAt, deletedBy }
// => All fields from all three schemas

// Paginated response wrapper
function PaginatedResponse<T extends z.ZodTypeAny>(itemSchema: T) {
  return PaginatedSchema.extend({
    items: z.array(itemSchema),
    // => items typed as array of the item schema's type
  });
}

const PaginatedEntitiesSchema = PaginatedResponse(EntitySchema);
// => { page, limit, total, items: Entity[] }

type PaginatedEntities = z.infer<typeof PaginatedEntitiesSchema>;
// => { page: number; limit: number; total: number; items: Entity[] }
```

**Key Takeaway**: `.and(schema)` chains intersection schemas inline. Combine with generic schema factories to build flexible, reusable schema patterns that work with any item type.

**Why It Matters**: Cross-cutting concerns — auditing, soft deletion, pagination — apply to many entities. Without composition, you duplicate these fields in every schema. With `.and()` and generic schema factories, you define each concern once and compose them. The `PaginatedResponse` factory pattern is especially powerful — define pagination metadata once, use it for any entity type. This reduces schema boilerplate dramatically in applications with many entity types and consistent API patterns.

---

### Example 50: Conditional Validation with superRefine

Use `.superRefine()` for complex conditional validation where some fields are required only when other fields have specific values.

```typescript
import { z } from "zod";

// Conditional validation: payment method determines required fields
const PaymentSchema = z
  .object({
    method: z.enum(["card", "bank_transfer", "paypal"]),
    // => Payment method determines which other fields are required

    // Card fields
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvv: z.string().optional(),

    // Bank transfer fields
    bankAccountNumber: z.string().optional(),
    bankRoutingNumber: z.string().optional(),

    // PayPal fields
    paypalEmail: z.string().email().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "card") {
      // => Card requires card-specific fields
      if (!data.cardNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Card number required for card payments",
          path: ["cardNumber"],
        });
      }
      if (!data.cardExpiry) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Card expiry required", path: ["cardExpiry"] });
      }
      if (!data.cardCvv) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CVV required", path: ["cardCvv"] });
      }
    }

    if (data.method === "bank_transfer") {
      // => Bank transfer requires bank-specific fields
      if (!data.bankAccountNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account number required", path: ["bankAccountNumber"] });
      }
      if (!data.bankRoutingNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Routing number required", path: ["bankRoutingNumber"] });
      }
    }

    if (data.method === "paypal" && !data.paypalEmail) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PayPal email required", path: ["paypalEmail"] });
    }
  });
```

**Key Takeaway**: `.superRefine()` enables complex conditional validation — required fields based on enum values, cross-field dependencies, and multi-condition rules that cannot be expressed as schema-level constraints.

**Why It Matters**: Real forms have conditional requirements that simple optional/required modifiers cannot express. Payment forms, shipping forms, and multi-step wizards frequently have fields that become required based on other field selections. `.superRefine()` puts all conditional validation logic in one place where the relationships are explicit. Without this pattern, conditional validation scatters across form components, event handlers, and API middleware — creating multiple places that must stay synchronized as requirements change.

---

### Example 51: Custom Error Map

A global custom error map replaces Zod's default English error messages. Essential for i18n and custom error message styles.

```typescript
import { z, ZodErrorMap, ZodIssueCode } from "zod";

// Custom error map function
const customErrorMap: ZodErrorMap = (issue, ctx) => {
  // => issue: ZodIssue - contains code, path, and context
  // => ctx.defaultError: Zod's default message for this issue type
  // => Return { message: string } to override

  if (issue.code === ZodIssueCode.too_small) {
    // => Handle minimum length/value violations
    if (issue.type === "string") {
      return { message: `Must be at least ${issue.minimum} characters` };
      // => Custom phrasing for string length errors
    }
    if (issue.type === "number") {
      return { message: `Must be at least ${issue.minimum}` };
      // => Custom phrasing for number minimum errors
    }
  }

  if (issue.code === ZodIssueCode.invalid_type) {
    // => Handle type mismatch errors
    if (issue.received === "undefined") {
      return { message: "This field is required" };
      // => More user-friendly than "Required" or "Expected string, received undefined"
    }
    return { message: `Expected ${issue.expected}, received ${issue.received}` };
    // => Explicit type mismatch message
  }

  if (issue.code === ZodIssueCode.invalid_string) {
    // => Handle string format validation errors
    if (issue.validation === "email") {
      return { message: "Please enter a valid email address" };
    }
    if (issue.validation === "url") {
      return { message: "Please enter a valid URL starting with http:// or https://" };
    }
  }

  return { message: ctx.defaultError };
  // => Fall through: use Zod's default message for unhandled cases
};

// Set as global error map
z.setErrorMap(customErrorMap);
// => All subsequent Zod errors use this map unless overridden

const emailResult = z.string().email().safeParse("not-email");
// => Uses custom error map: "Please enter a valid email address"
```

**Key Takeaway**: `z.setErrorMap(fn)` registers a global error message customizer. Use for i18n, custom message styles, or centralizing error message management.

**Why It Matters**: Applications serving non-English users need localized validation messages. Maintaining translations in schemas directly means updating messages in dozens of places per locale. A global error map centralizes all error message logic — implement once, applies everywhere. The error map function receives structured issue information (code, type, minimum, expected) rather than raw strings, enabling dynamic message generation that adapts to context. This is also the correct integration point for validation message libraries that map Zod error codes to translation keys.

---

### Example 52: z.function() Schema

`z.function()` validates function arguments and return values. This creates runtime-safe function wrappers that verify inputs and outputs.

```typescript
import { z } from "zod";

// Define function schema
const AddFunction = z
  .function()
  .args(z.number(), z.number())
  // => .args(): validates function arguments
  // => This function takes two numbers
  .returns(z.number());
// => .returns(): validates return value

// Implement the typed function
const add = AddFunction.implement((a, b) => {
  // => a and b are validated as numbers before this runs
  return a + b;
  // => Return value validated as number
});

const sum = add(3, 4);
// => Arguments validated: 3 and 4 are both numbers
// => Return validated: 7 is a number
// => sum = 7

// Function with complex arguments
const ProcessUser = z
  .function()
  .args(
    z.object({ name: z.string(), age: z.number() }),
    // => First arg: user object schema
    z.boolean().optional(),
    // => Second arg: optional boolean
  )
  .returns(z.string());

const processUser = ProcessUser.implement((user, verbose = false) => {
  // => user.name and user.age are validated before running
  const detail = verbose ? ` (age: ${user.age})` : "";
  return `${user.name}${detail}`;
  // => Return validated as string
});

console.log(processUser({ name: "Aisha", age: 28 }, true));
// => Output: Aisha (age: 28)

// Async function validation
const FetchUser = z
  .function()
  .args(z.string().uuid())
  .returns(z.promise(z.object({ id: z.string(), name: z.string() })));
// => z.promise() wraps async return value schema
```

**Key Takeaway**: `z.function().args(...).returns(schema).implement(fn)` creates runtime-validated functions. Arguments are checked before the function runs; return values are checked after.

**Why It Matters**: TypeScript function signatures are compile-time guarantees — callers can pass wrong types if the call site uses `any` or dynamic data. `z.function()` adds runtime enforcement for functions that receive data from untrusted sources. This is particularly valuable for event handlers, message processors, and plugin APIs where callers may not be under your control. The `.implement()` wrapper makes the validation transparent — callers use the function normally, unaware of the runtime checks.

---

### Example 53: Readonly Schema

`.readonly()` marks the output as deeply readonly, ensuring validated objects cannot be accidentally mutated.

```typescript
import { z } from "zod";

// Readonly schema
const ConfigSchema = z
  .object({
    apiUrl: z.string().url(),
    timeout: z.number().int().positive().default(5000),
    retries: z.number().int().nonnegative().default(3),
    features: z.object({
      darkMode: z.boolean().default(false),
      analytics: z.boolean().default(true),
    }),
  })
  .readonly();
// => .readonly() makes all output properties readonly
// => Prevents accidental mutation of validated config

type Config = z.infer<typeof ConfigSchema>;
// => Config = Readonly<{
// =>   apiUrl: string;
// =>   timeout: number;
// =>   retries: number;
// =>   features: { darkMode: boolean; analytics: boolean };
// => }>

const config = ConfigSchema.parse({
  apiUrl: "https://api.example.com",
});
// => config.timeout = 5000 (default)
// => config.features.darkMode = false (default)

// TypeScript prevents mutation — uncomment to see error:
// config.timeout = 10000;
// => ERROR: Cannot assign to 'timeout' because it is a read-only property

// Note: readonly is TypeScript-only — JavaScript doesn't enforce it at runtime
// Use Object.freeze() if you need runtime immutability

const frozenConfig = Object.freeze(config);
// => Object.freeze: JavaScript runtime immutability
// => Combined with .readonly(): both TypeScript and runtime protection
```

**Key Takeaway**: `.readonly()` marks the parsed output as TypeScript `Readonly<T>`. Use for configuration objects, constants, and any data that should be treated as immutable after validation.

**Why It Matters**: Mutable configuration and constants are a source of bugs where one part of the application accidentally modifies shared state that other parts rely on. TypeScript's readonly modifier makes such mutations compile errors, catching the mistake before runtime. Validated configuration objects are a natural fit — they're created once at startup and should never change. Combining Zod's `.readonly()` with JavaScript's `Object.freeze()` provides layered protection: TypeScript catches it at compile time, JavaScript catches it at runtime for code that bypasses type checks.

---

### Example 54: Schema from Unknown Data

When schema structure is partially unknown, `z.unknown()` and `z.any()` handle unvalidated fields while still validating known structure.

```typescript
import { z } from "zod";

// z.unknown(): accepts anything but requires explicit narrowing to use
const unknownSchema = z.unknown();
// => Accepts any value including undefined
// => type: unknown (must narrow before use)

const val = unknownSchema.parse({ anything: "here" });
// => val = { anything: "here" } (type: unknown)
// => Must narrow with typeof/instanceof before accessing properties

// z.any(): accepts anything and allows unchecked access
const anySchema = z.any();
// => Accepts any value
// => type: any (no narrowing required — bypass type system)
// => Use sparingly: defeats TypeScript's purpose

// Practical: known structure with unknown metadata
const EventSchema = z.object({
  id: z.string().uuid(),
  // => Always validated
  type: z.string(),
  // => Event type always validated
  timestamp: z.date(),
  // => Timestamp always validated
  metadata: z.record(z.string(), z.unknown()),
  // => Metadata: keys are strings, values can be anything
  // => Validates structure (is a record) but not value types
});

type Event = z.infer<typeof EventSchema>;
// => { id: string; type: string; timestamp: Date; metadata: Record<string, unknown> }

const event = EventSchema.parse({
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "USER_ACTION",
  timestamp: new Date(),
  metadata: { browser: "Chrome", ip: "192.0.2.1", sessionId: "abc123" },
  // => Metadata values are unknown — structure validated, types not
});

// Accessing unknown values requires explicit narrowing
if (typeof event.metadata.browser === "string") {
  console.log("Browser:", event.metadata.browser);
  // => TypeScript allows access only after typeof check
}
```

**Key Takeaway**: `z.unknown()` validates that a field exists but leaves its type as `unknown`, requiring explicit narrowing. Use for extensible schemas where some fields have dynamic content.

**Why It Matters**: Webhook payloads, plugin systems, and extensible event schemas often have a known "envelope" structure with unknown "payload" content. Validating the envelope guarantees message integrity while leaving payload typing to specialized handlers. `z.unknown()` is the correct choice over `z.any()` because it forces explicit type narrowing — the compiler ensures you check types before using unknown values. `z.any()` bypasses the type system entirely and should only appear in migration code or when interoperating with fully untyped systems.

---

### Example 55: Schema Introspection

Zod schemas are JavaScript objects with introspectable properties. You can extract schema metadata to build documentation, UI, and tooling.

```typescript
import { z } from "zod";

const ProductSchema = z.object({
  id: z.string().uuid().describe("Unique product identifier"),
  // => .describe() adds a description string to the schema
  name: z.string().min(1).max(200).describe("Product display name"),
  price: z.number().positive().describe("Price in USD"),
  category: z.enum(["electronics", "clothing", "food"]).describe("Product category"),
  isAvailable: z.boolean().default(true).describe("Whether product is in stock"),
});

// Access schema description
const idSchema = ProductSchema.shape.id;
const description = idSchema.description;
// => description = "Unique product identifier"

// Inspect schema type
const categorySchema = ProductSchema.shape.category;
// => categorySchema is a ZodEnum schema

if (categorySchema instanceof z.ZodEnum) {
  console.log("Valid categories:", categorySchema.options);
  // => Output: Valid categories: ["electronics", "clothing", "food"]
}

// Inspect object shape
const schemaShape = ProductSchema.shape;
// => schemaShape = { id: ZodString, name: ZodString, price: ZodNumber, ... }

// Get all field names
const fieldNames = Object.keys(schemaShape);
// => fieldNames = ["id", "name", "price", "category", "isAvailable"]

// Check if field is optional
const isIdOptional = schemaShape.id.isOptional();
// => isIdOptional = false (id is required)

const isAvailabilityOptional = schemaShape.isAvailable.isOptional();
// => isAvailabilityOptional = true (has default → acts as optional input)
```

**Key Takeaway**: Zod schemas are introspectable objects — use `.describe()` to add metadata, `.shape` to access field schemas, and `.options` to extract enum values. This enables schema-driven UI and documentation generation.

**Why It Matters**: Schema introspection powers schema-driven development — generating forms from schemas, producing API documentation, creating database migration scripts, and building visual schema editors. Adding `.describe()` annotations to schemas creates a foundation for OpenAPI spec generation, eliminating the duplication between Zod schemas and Swagger decorators. The ability to iterate over schema shape enables generic form generators that create appropriate input components for each field type without per-field configuration.
