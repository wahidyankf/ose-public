(ns demo-be-cjpd.handlers.report
  "P&L report handler."
  (:require [cheshire.core :as json]
            [demo-be-cjpd.db.expense-repo :as expense-repo]))

(defn pl-report-handler
  "GET /api/v1/reports/pl — Return profit and loss report."
  [ds]
  (fn [request]
    (let [user-id  (:user-id (:identity request))
          params   (:query-params request)
          ;; Support both startDate/endDate (E2E) and from/to (Gherkin spec)
          from     (or (get params :startDate) (get params "startDate")
                       (get params :from) (get params "from"))
          to       (or (get params :endDate) (get params "endDate")
                       (get params :to) (get params "to"))
          currency (or (get params :currency) (get params "currency") "USD")
          report   (expense-repo/pl-report ds user-id from to currency)
          income-breakdown
          (mapv (fn [[cat amt]] {"category" cat "type" "income" "total" amt})
                (:income-breakdown report))
          expense-breakdown
          (mapv (fn [[cat amt]] {"category" cat "type" "expense" "total" amt})
                (:expense-breakdown report))]
      {:status  200
       :headers {"Content-Type" "application/json"}
       :body    (json/generate-string {:startDate        from
                                       :endDate          to
                                       :currency         (.toUpperCase (str currency))
                                       :totalIncome      (:income-total report)
                                       :totalExpense     (:expense-total report)
                                       :net              (:net report)
                                       :incomeBreakdown  income-breakdown
                                       :expenseBreakdown expense-breakdown})})))
