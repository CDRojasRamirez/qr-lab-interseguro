package http

import "qrchallenge/go-api/internal/factorization/application"

func toCommand(req factorizeRequest) application.FactorizeCommand {
	return application.FactorizeCommand{Values: req.Matrix}
}

func toResponse(res application.FactorizeResult) factorizeResponse {
	rep := res.Statistics
	per := make([]perMatrixDTO, len(rep.PerMatrix))
	for i, m := range rep.PerMatrix {
		s := m.Statistics
		per[i] = perMatrixDTO{
			Name: m.Name, Max: s.Max, Min: s.Min, Average: s.Average,
			Sum: s.Sum, Count: s.Count, IsDiagonal: m.IsDiagonal,
		}
	}
	g := rep.Global
	return factorizeResponse{
		Q: res.Q.ToSlice(),
		R: res.R.ToSlice(),
		Statistics: statisticsDTO{
			Global:      statsDTO{Max: g.Max, Min: g.Min, Average: g.Average, Sum: g.Sum, Count: g.Count},
			PerMatrix:   per,
			AnyDiagonal: rep.AnyDiagonal,
		},
	}
}
