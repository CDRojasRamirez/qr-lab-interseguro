// Package application orchestrates factorization use cases (application layer).
// It declares the ports that infrastructure implements.
//
// Files:
//   - factorize_matrix.go: the FactorizeMatrix use case, command and result.
//   - ports.go: the StatsAnalyzer output port and its contract types.
//   - errors.go: sentinel errors for Analytics failures.
package application
