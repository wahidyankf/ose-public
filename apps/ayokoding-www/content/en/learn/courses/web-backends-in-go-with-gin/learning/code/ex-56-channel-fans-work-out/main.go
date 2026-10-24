// => Example 56: Channel Fans Work Out.
// => Channels distribute work to a fixed pool and collect results without
// => sharing memory. This example squares eight numbers across three
// => workers, sorts the results, and prints the ordered squares: finishing
// => order varies, printed order never does.
package main

import (
	"fmt"                      // => prints the ordered squares
	"github.com/gin-gonic/gin" // => the route serving the pool's answer (co-07)
	"net/http/httptest"        // => in-process request and recorder (co-09)
	"sort"                     // => sorts results: arrival order is random (co-07)
	"sync"                     // => waits for the worker pool to finish
)

// => squares fans nums across three workers and returns every square sorted.
// => jobs and results are channels: workers never share memory (co-07)
func squares(nums []int) []int { // => inputs in, ordered squares out
	// => unbuffered jobs pace the feeder: workers pull when ready
	jobs := make(chan int)    // => unbuffered: workers pull on demand
	results := make(chan int) // => one result per job, in finish order
	// => the wait group joins the pool before results close
	var wg sync.WaitGroup    // => tracks the three workers
	for w := 0; w < 3; w++ { // => the fixed pool: three goroutines
		wg.Add(1)   // => count the worker before starting it
		go func() { // => workers live until jobs closes
			defer wg.Done()       // => always mark done when the jobs end
			for n := range jobs { // => pull until the channel closes
				results <- n * n // => square and report: no shared state
			}
		}()
	}
	go func() { // => the feeder runs beside the pool
		for _, n := range nums { // => every input becomes one job
			jobs <- n // => hand each number to a waiting worker
		}
		// => closing jobs is the shutdown signal: range loops end
		close(jobs) // => no more work: workers drain and exit
	}()
	go func() { // => the closer waits, then seals the results
		wg.Wait() // => join all three workers first
		// => closing results ends collection: every square arrived
		close(results) // => no more squares coming: the loop below ends
	}()
	// => arrival order first: sorting comes after collection
	out := []int{} // => collect in arrival order first
	// => one iteration per square: eight jobs means eight results
	for r := range results { // => one iteration per finished square
		out = append(out, r) // => finish order varies run to run
	}
	// => sorting erases finish order: only the set of squares matters
	sort.Ints(out) // => sort before printing: golden output is stable (co-07)
	return out     // => the ordered squares
}

// => newRouter serves the squares of one through eight at one route.
func newRouter() *gin.Engine { // => the system under test
	gin.SetMode(gin.TestMode) // => silence the debug banner for golden output
	// => bare engine: the pool carries the concurrency, not middleware
	router := gin.New()                           // => bare engine: no hidden middleware
	router.GET("/squares", func(c *gin.Context) { // => the pool runs per request
		// => one through eight in, ordered squares out: the pool runs per request
		c.JSON(200, gin.H{"squares": squares([]int{1, 2, 3, 4, 5, 6, 7, 8})}) // => ordered squares (co-04)
	})
	return router // => hand the wired engine back
}

// => check serves one GET in-process and prints the status with the body.
func check(router *gin.Engine, target string) { // => the path is the only variable
	req := httptest.NewRequest("GET", target, nil)            // => server-side request, no socket
	w := httptest.NewRecorder()                               // => in-memory response capture
	router.ServeHTTP(w, req)                                  // => the pool runs inside (co-09)
	fmt.Println("GET", target, "->", w.Code, w.Body.String()) // => one golden line
}

func main() {
	router := newRouter() // => wiring separate from traffic, as always
	// => eight inputs, three workers, one sorted answer: 1 to 64
	check(router, "/squares") // => Output: GET /squares -> 200 {"squares":[1,4,9,16,25,36,49,64]}
}
