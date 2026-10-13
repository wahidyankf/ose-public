// Kata 02: Classify a status code into its response class.
//
// RFC 9110 groups statuses by leading digit. Handlers pick the code;
// this classifier names the class, which is what a client branches on.
package main

import (
	"fmt" // => prints the class list for visual inspection
	"log" // => fail-fast on any self-check mismatch
)

// ClassifyStatus maps a code to success, redirect, client-error, or server-error.
func ClassifyStatus(code int) (string, error) { // => co-03: five classes share the 200-599 range
	if code >= 200 && code < 300 { // => 2xx: the request succeeded
		return "success", nil
	}
	if code >= 300 && code < 400 { // => 3xx: further action (redirect) needed
		return "redirect", nil
	}
	if code >= 400 && code < 500 { // => 4xx: the client made a mistake
		return "client-error", nil
	}
	if code >= 500 && code < 600 { // => 5xx: the server failed a valid request
		return "server-error", nil
	}
	return "", fmt.Errorf("not a valid HTTP status code: %d", code) // => outside 200-599 is no class at all
}

func mustClassify(code int) string {
	class, err := ClassifyStatus(code) // => every taught code must classify cleanly
	if err != nil {                    // => a taught code failing here is a kata bug
		log.Fatalf("classify %d: %v", code, err)
	}
	return class // => the label the assertions below check
}

func main() {
	codes := []int{200, 201, 204, 301, 400, 401, 404, 405, 422, 500} // => the exact status set this course teaches
	classes := make([]string, 0, len(codes))                         // => one label per code, same order
	for _, c := range codes {                                        // => classify each code in order
		classes = append(classes, mustClassify(c)) // => append keeps the input order
	}
	fmt.Println(classes) // => Output: [success success success redirect client-error client-error client-error client-error client-error server-error]

	if mustClassify(201) != "success" { // => 201 Created, a successful POST
		log.Fatalf("201 must be success")
	}
	if mustClassify(422) != "client-error" { // => Unprocessable Content, native to RFC 9110
		log.Fatalf("422 must be client-error")
	}
	if mustClassify(500) != "server-error" { // => an unhandled failure, never a stack trace
		log.Fatalf("500 must be server-error")
	}
	fmt.Println("kata-02 OK") // => the self-check line this track greps for
}
