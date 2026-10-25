// shop/Cart.java: the basket owned by the shop package.
// Package-private pricing stays inside shop; only the total crosses
// the boundary, which is how packages draw API lines.
package shop; // => this file lives in the shop package

import java.util.ArrayList; // => the item list inside the basket
import java.util.List; // => interface on the left as always

public class Cart {

  // => public: the one type this package shares
  private final List<String> items = new ArrayList<>(); // => private: contents stay hidden

  public void add(String item) {
    // => public: the boundary call other packages use
    items.add(item); // => the only mutation path into the basket
  } // => add ends: contents grow, encapsulation holds

  public int count() {
    // => public: observers count without seeing items
    return items.size(); // => size answers without exposing the list
  } // => count ends: number out, contents still hidden

  int subtotal(int unitPrice) {
    // => package-private: pricing stays inside shop
    return items.size() * unitPrice; // => arithmetic the outside never calls
  } // => subtotal ends: visible to shop, invisible to importers
} // => Cart ends: two public methods, one package secret
