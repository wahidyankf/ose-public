// Example 75: Expression Evaluator.
//
// Read this like a language implementer: tokenize turns characters into
// tokens, parse turns tokens into a tree, and eval walks the tree. Three
// passes, three functions, each testable alone; the transcript evaluates
// four expressions covering literals, precedence, parentheses, and the two
// refused shapes (trailing operator, divide by zero).
// => tokens are an enum: Num carries value, Op carries which operation
// => parse is recursive descent: expr handles +, term handles *, factor atoms

// Token is the vocabulary of the four expressions main runs below.
// => Num holds u32 values: the evaluator never sees raw characters
// => Op holds + - * / and both parens: six symbols, each named once
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Token {
    // => seven variants: one number shape plus six symbols
    Num(u32),
    // => Num carries the value: lexing already did the arithmetic
    Plus,
    // => Plus adds: the loosest binding, parsed last in expr
    Minus,
    // => Minus subtracts: same level as Plus, left to right
    Star,
    // => Star multiplies: one level tighter than Plus
    Slash,
    // => Slash divides: same level as Star, zero refused later
    Open,
    // => Open nests: factor consumes it, then demands a Close
    Close,
    // => Close ends the nest: anything else after Open refuses
}

// tokenize scans digits and symbols, skipping spaces, refusing the rest.
// => digits accumulate by place value: 12 is one token, not two
// => unknown characters refuse with their position: lexing never guesses
fn tokenize(text: &str) -> Result<Vec<Token>, String> {
    // => owned Vec leaves: numbers copy out, symbols are unit variants
    // => tokens start empty: each scanned character appends or refuses
    let mut tokens: Vec<Token> = Vec::new();
    // => Vec grows per character: digits and symbols append in order
    // => bytes with positions: ASCII arithmetic is safe, digits are ASCII
    let bytes = text.as_bytes();
    // => bytes borrow the text: indexing never copies the input
    let mut index = 0;
    // => index is the cursor: every arm advances it, or refuses
    while index < bytes.len() {
        // => bounds first: the loop ends exactly at the last byte
        let byte = bytes[index];
        // => u8 copies out: matching owns the byte, not a borrow
        // => digits extend the current number: value = value * 10 + digit
        if byte.is_ascii_digit() {
            // => digits branch first: numbers consume greedily, symbols singly
            let mut value = 0u32;
            // => place value starts at zero: each digit shifts and adds
            while index < bytes.len() && bytes[index].is_ascii_digit() {
                // => the inner loop eats digits: multi-digit numbers stay whole
                value = value * 10 + (bytes[index] - b'0') as u32;
                // => ASCII math: subtracting b'0' yields the digit's value
                index += 1;
                // => advance per digit: the outer loop resumes after the number
            }
            tokens.push(Token::Num(value));
            // => one token per number: 12 pushes once, not twice
            continue;
            // => skip the symbol match: digits never fall through below
        }
        // => one symbol per known byte: spaces fall through to the skip arm
        match byte {
            // => one arm per symbol: unknown bytes refuse in the wildcard
            b'+' => tokens.push(Token::Plus),
            // => plus tokenizes: the character becomes a Plus variant
            b'-' => tokens.push(Token::Minus),
            // => minus tokenizes: same push shape, Minus variant
            b'*' => tokens.push(Token::Star),
            // => star tokenizes: multiplication waits for term
            b'/' => tokens.push(Token::Slash),
            // => slash tokenizes: division waits for term's zero check
            b'(' => tokens.push(Token::Open),
            // => open tokenizes: factor will nest an expr here
            b')' => tokens.push(Token::Close),
            // => close tokenizes: factor demands it after nested exprs
            b' ' => {}
            // => spaces vanish: the only byte the lexer silently drops
            // => anything else refuses with its byte offset: lexing is total
            _ => return Err(format!("bad character at byte {index}")),
        }
        index += 1;
        // => symbols advance once: digits already advanced in their loop
    }
    Ok(tokens)
    // => the full token stream returns: parsing starts below
}

// Parser holds the token slice and the cursor the descent shares.
// => position advances only on consume: peeking never moves the cursor
struct Parser<'a> {
    // => the lifetime ties tokens to input: the slice never outlives text
    tokens: &'a [Token],
    // => borrowed slice: the parser reads, tokenize owns
    position: usize,
    // => position is the cursor: peek reads it, consume bumps it
}

impl<'a> Parser<'a> {
    // => one impl, five methods: peek, consume, expr, term, factor
    // => peek reads without consuming: the descent decides before it eats
    fn peek(&self) -> Option<Token> {
        // => copied out: Token is Copy, so peek never borrows
        self.tokens.get(self.position).copied()
        // => get refuses past the end: exhaustion is None, not a trap
    }

    // => consume advances past the peeked token: the descent commits to it
    fn consume(&mut self) {
        // => &mut self advances: consuming mutates only the cursor
        self.position += 1;
        // => one step per call: the descent consumes exactly what it peeked
    }

    // => expr handles + and -: the loosest binding, parsed last, runs first
    fn expr(&mut self) -> Result<u32, String> {
        // => Result threads failures: overflow and underflow refuse upward
        // => the left side parses as a term: * and / bind tighter below
        let mut value = self.term()?;
        // => ? propagates: a term failure ends the whole parse here
        // => each + or - extends the sum: left associativity falls out
        while matches!(self.peek(), Some(Token::Plus) | Some(Token::Minus)) {
            // => the loop continues on + or -: anything else ends the sum
            let plus = self.peek() == Some(Token::Plus);
            // => remember the operator: consume erases which one followed
            self.consume();
            // => eat the operator: the right side parses as a fresh term
            let rhs = self.term()?;
            // => the right side binds tighter: term handles * and / first
            // => checked ops refuse overflow instead of wrapping the grade
            value = if plus {
                // => checked arithmetic: overflow refuses instead of wrapping
                value
                    .checked_add(rhs)
                    .ok_or_else(|| "overflow".to_string())?
                // => checked_add returns None on overflow: ok_or_else names it
            } else {
                value
                    .checked_sub(rhs)
                    .ok_or_else(|| "underflow".to_string())?
                // => checked_sub returns None below zero: u32 cannot go negative
            };
        }
        // => the accumulated sum returns: the loop ended on a non-operator
        Ok(value)
    }

    // => term handles * and /: tighter than expr, looser than atoms
    fn term(&mut self) -> Result<u32, String> {
        // => same loop shape as expr: tighter operators, identical discipline
        // => the left side parses as a factor: parens and numbers live there
        let mut value = self.factor()?;
        // => factors are the atoms: numbers and parenthesized exprs
        // => each * or / extends the product: same shape as expr above
        while matches!(self.peek(), Some(Token::Star) | Some(Token::Slash)) {
            // => the loop continues on * or /: + and - end the product
            let times = self.peek() == Some(Token::Star);
            // => remember the operator: consume erases which one followed
            self.consume();
            // => eat the operator: the right side parses as a fresh factor
            let rhs = self.factor()?;
            // => factor binds tightest: atoms and parens parse here
            value = if times {
                // => multiply checked, divide guarded: both refusals name themselves
                value
                    .checked_mul(rhs)
                    .ok_or_else(|| "overflow".to_string())?
                // => checked_mul refuses overflow: grades never wrap around
            } else if rhs == 0 {
                // => zero divisor branches: division refuses before dividing
                // => divide by zero refuses by name: the evaluator never traps
                return Err("divide by zero".to_string());
                // => return skips the loop: a zero divisor ends the whole term
            } else {
                value / rhs
                // => plain division: rhs is proven nonzero two lines above
            };
        }
        // => the accumulated product returns: the loop ended on + or -
        Ok(value)
    }

    // => factor handles atoms: numbers stand alone, parens nest an expr
    fn factor(&mut self) -> Result<u32, String> {
        // => atoms and parens: the tightest binding, parsed in one match
        match self.peek() {
            // => one peek decides: number, open paren, or refusal
            // => a number consumes itself: the leaf of the whole descent
            Some(Token::Num(value)) => {
                // => the leaf arm: numbers need no recursion at all
                self.consume();
                // => eat the number: the leaf consumes itself, done
                Ok(value)
                // => the digit value returns: lexing already computed it
            }
            // => an open paren consumes, nests an expr, and demands a close
            Some(Token::Open) => {
                // => the nesting arm: an expr lives inside these parens
                self.consume();
                // => eat the open paren: the nested expr parses next
                let value = self.expr()?;
                // => recurse into expr: nesting re-enters at the loosest level
                // => the close paren must follow: anything else refuses
                if self.peek() == Some(Token::Close) {
                    // => peek, not consume: the check reads before committing
                    self.consume();
                    // => eat the close: the nest resolves to its inner value
                    Ok(value)
                    // => the nested value returns: parens group, never compute
                } else {
                    Err("missing )".to_string())
                    // => unclosed nests refuse: the message shows the missing half
                }
            }
            // => anything else at atom position refuses: operators need operands
            _ => Err("expected a number or (".to_string()),
            // => operators and closes refuse here: atoms were promised
        }
    }
}

// evaluate wires the three passes: tokenize, parse the expr, demand the end.
// => trailing tokens refuse: "2 + 3 4" is shapeless, not 9
// => the parser must finish exactly at the end: partial parses never count
fn evaluate(text: &str) -> Result<u32, String> {
    // => text in, value out: the three passes run in fixed order
    let tokens = tokenize(text)?;
    // => lexing first: bad characters refuse before any parsing
    let mut parser = Parser {
        tokens: &tokens,
        position: 0,
    };
    // => position zero: the descent starts at the first token
    let value = parser.expr()?;
    // => expr parses the whole sum: precedence handled inside
    // => leftover tokens refuse: the whole input must parse, not a prefix
    if parser.position == tokens.len() {
        // => exact consumption: a prefix parse is not a full parse
        Ok(value)
    } else {
        // => nothing left over: the value earned its return
        Err("trailing input".to_string())
        // => trailing tokens refuse: extra input is shapeless, not ignored
    }
}

fn main() {
    // => four inputs, four lines: two values, two named refusals
    // => four expressions: precedence, parens, and the two refused shapes
    for text in ["2 + 3 * 4", "(2 + 3) * 4", "10 / 0", "2 +"] {
        // => the array is the suite: precedence, parens, zero, truncation
        // => each line shows input and answer: values print, refusals explain
        match evaluate(text) {
            Ok(value) => println!("{text} = {value}"),
            // => values print with their input: 14 and 20, computed
            Err(reason) => println!("{text}: refused: {reason}"),
            // => refusals print with their cause: naming beats trapping
        }
    }
}
