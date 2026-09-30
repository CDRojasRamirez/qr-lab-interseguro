package statsclient

import "qrchallenge/go-api/internal/factorization/application"

// Wire DTOs of the Node statistics API. They stay private to this adapter so
// the upstream contract never leaks into the application layer (ACL).

type requestDTO struct {
	Matrices []matrixDTO `json:"matrices"`
}

type matrixDTO struct {
	Name   string      `json:"name"`
	Values [][]float64 `json:"values"`
}

type statsDTO struct {
	Max     float64 `json:"max"`
	Min     float64 `json:"min"`
	Average float64 `json:"average"`
	Sum     float64 `json:"sum"`
	Count   int     `json:"count"`
}

type perMatrixDTO struct {
	statsDTO
	Name       string `json:"name"`
	IsDiagonal bool   `json:"isDiagonal"`
}

type responseDTO struct {
	Global      statsDTO       `json:"global"`
	PerMatrix   []perMatrixDTO `json:"perMatrix"`
	AnyDiagonal bool           `json:"anyDiagonal"`
}

func toRequest(in []application.NamedMatrix) requestDTO {
	out := requestDTO{Matrices: make([]matrixDTO, len(in))}
	for i, m := range in {
		out.Matrices[i] = matrixDTO{Name: m.Name, Values: m.Matrix.ToSlice()}
	}
	return out
}

func (s statsDTO) toStatistics() application.Statistics {
	return application.Statistics{Max: s.Max, Min: s.Min, Average: s.Average, Sum: s.Sum, Count: s.Count}
}

func (r responseDTO) toReport() application.StatisticsReport {
	rep := application.StatisticsReport{
		Global:      r.Global.toStatistics(),
		PerMatrix:   make([]application.MatrixStatistics, len(r.PerMatrix)),
		AnyDiagonal: r.AnyDiagonal,
	}
	for i, m := range r.PerMatrix {
		rep.PerMatrix[i] = application.MatrixStatistics{
			Name: m.Name, Statistics: m.toStatistics(), IsDiagonal: m.IsDiagonal,
		}
	}
	return rep
}
