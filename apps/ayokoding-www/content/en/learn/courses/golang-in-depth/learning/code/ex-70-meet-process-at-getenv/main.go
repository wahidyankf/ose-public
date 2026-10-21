// Example 70: Meet the Process at getenv.
//
// Environment is the process boundary: configuration crosses from the OS as
// strings. LookupEnv separates unset from set-empty, the comma-ok honesty again.
package main

import (
	"fmt" // => prints the resolved region and the unset verdict
	"os"  // => Setenv, Getenv, LookupEnv: the boundary toolkit, stdlib only
)

func main() {
	// => Setenv stages the boundary INSIDE the program: deterministic input
	// => real deployments set this outside; tests and examples set it here
	os.Setenv("APP_REGION", "jakarta") // => stage: region configured, non-empty
	// => LookupEnv returns value PLUS presence: unset vs empty stay distinct
	region, ok := os.LookupEnv("APP_REGION") // => jakarta, true: set and present
	// => presence gates the default: configured values always win over fallbacks
	if !ok || region == "" { // => unset OR empty: fall back, never crash
		region = "default" // => fallback: the service still starts somewhere
	}
	fmt.Println("region:", region) // => Output: region: jakarta
	// => never-staged variable: absent from the boundary, honestly reported
	if _, ok := os.LookupEnv("APP_NEVER_SET"); !ok { // => unset: flag says so
		fmt.Println("unset detected") // => Output: unset detected
	}
	// => Getenv (no flag) suits optional decoration: empty means "skip it"
	fmt.Println("suffix:[" + os.Getenv("APP_NEVER_SET") + "]") // => Output: suffix:[]
}
