package parity

import (
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
)

// roundTripFunc answers requests in memory, so the probe opens no socket.
type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func answer(status int, location string) *http.Response {
	header := http.Header{}
	if location != "" {
		header.Set("Location", location)
	}
	return &http.Response{StatusCode: status, Header: header, Body: io.NopCloser(strings.NewReader(""))}
}

func TestOSHostWiresEveryField(t *testing.T) {
	h := OSHost()
	if h.Working == "" || h.Sub == nil || h.ReadFile == nil || h.WriteFile == nil || h.Fetch == nil || h.Stdout == nil || h.Stderr == nil {
		t.Fatalf("OSHost leaves a field unwired: %+v", h)
	}
}

// failingClose is a response body whose Close fails after the status was read.
type failingClose struct{ io.Reader }

func (failingClose) Close() error { return errors.New("close failed") }

func TestProbeReportsAFailedBodyCloseInsteadOfDiscardingIt(t *testing.T) {
	transport := roundTripFunc(func(*http.Request) (*http.Response, error) {
		response := answer(200, "")
		response.Body = failingClose{strings.NewReader("")}
		return response, nil
	})
	probe := newFetch(&http.Client{Transport: transport, CheckRedirect: noFollow})

	if _, err := probe("http://127.0.0.1:3102/en"); err == nil || err.Error() != "close failed" {
		t.Fatalf("probe error = %v; want the body close failure returned", err)
	}
}

func TestProbeReportsTheStatusAndNeverFollowsARedirect(t *testing.T) {
	transport := roundTripFunc(func(r *http.Request) (*http.Response, error) {
		switch r.URL.Path {
		case "/en":
			return answer(200, ""), nil
		case "/moved":
			return answer(308, "/en"), nil
		case "/down":
			return nil, errors.New("connection refused")
		}
		return answer(404, ""), nil
	})
	probe := newFetch(&http.Client{Transport: transport, CheckRedirect: noFollow})

	if got, err := probe("http://127.0.0.1:3102/en"); err != nil || got != (Reply{Status: 200}) {
		t.Fatalf("200 probe = %+v, %v", got, err)
	}
	if got, err := probe("http://127.0.0.1:3102/moved"); err != nil || got != (Reply{Status: 308, Location: "/en"}) {
		t.Fatalf("308 probe = %+v, %v; want the redirect recorded, not followed", got, err)
	}
	if _, err := probe("http://127.0.0.1:3102/down"); err == nil {
		t.Fatal("unreachable probe returned no error")
	}
	if _, err := probe("://not a url"); err == nil {
		t.Fatal("malformed URL returned no error")
	}
}
