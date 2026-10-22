// Main.java: the importer that shops through the boundary.
// Main sees only the public Cart API; the package-private pricing
// stays unreachable, which the commented line below would prove.
import shop.Cart; // => the single type Main may use from shop

public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    Cart cart = new Cart(); // => constructed through the public type
    cart.add("rice"); // => boundary call one: add through the API
    cart.add("sugar"); // => boundary call two: same door, second item
    System.out.println("items: " + cart.count()); // => Output: items: 2
    // cart.subtotal(10); // => uncomment to see the error: subtotal is not visible here
    System.out.println("shops cleanly: true"); // => Output: shops cleanly: true
  } // => main ends: public API used, package secrets untouched
}
