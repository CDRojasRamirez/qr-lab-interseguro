// Package statsclient is the outbound adapter to the Node statistics API
// (infrastructure layer). It acts as an Anti-Corruption Layer: it translates
// upstream payloads and failures into application-level types and errors, and
// forwards the caller's bearer token taken from requestctx.
//
// Files:
//   - client.go: Client implementing application.StatsAnalyzer.
//   - dto.go: private wire DTOs and translation to StatisticsReport.
package statsclient
