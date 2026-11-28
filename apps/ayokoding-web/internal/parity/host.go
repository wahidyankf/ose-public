package parity

import (
	"net/http"
)

// newFetch returns the probe for one URL. It makes a single GET through the
// client and reports the status and the redirect target, if any. It never
// retries, and it never follows a redirect: noFollow stops the client first.
func newFetch(client *http.Client) func(url string) (Reply, error) {
	return func(target string) (Reply, error) {
		request, err := http.NewRequest(http.MethodGet, target, nil)
		if err != nil {
			return Reply{}, err
		}
		response, err := client.Do(request)
		if err != nil {
			return Reply{}, err
		}
		reply := Reply{Status: response.StatusCode, Location: response.Header.Get("Location")}
		if err := response.Body.Close(); err != nil {
			return Reply{}, err
		}
		return reply, nil
	}
}

// noFollow stops the client at the first redirect, so the probe records the
// redirect as the reply instead of requesting its target.
func noFollow(*http.Request, []*http.Request) error {
	return http.ErrUseLastResponse
}
