public final class Example58 {
    record Address(String city) {}
    // => The inner record contributes the city component.
    record Person(String name, Address address) {}
    // => The outer record holds an Address as one component.
    public static void main(String[] args) {
        Object value = new Person("Ada", new Address("London")); // => nested Address
        // => The declared type Object does not hide the runtime Person shape.
        String city = switch (value) {
            // => The matching case yields the city String.
            case Person(var name, Address(var place)) -> place; // => place is London
            // => The nested Address pattern binds place to London.
            default -> "unknown";
            // => A value of another runtime type would take this fallback.
        };
        System.out.println(city); // => London
    }
}
