;; => Kata 6 starter: row maps enter unchecked and explode downstream.
(defn row-total [{id :user/id qty :user/qty}] ;; => trusts both keys blindly
  (* id qty)) ;; => multiplies whatever arrived
(println (row-total {:user/id 7 :user/qty 3})) ;; => prints 21, the one good case
