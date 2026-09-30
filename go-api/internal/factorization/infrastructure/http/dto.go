package http

// factorizeRequest is the body of POST /api/v1/factorizations.
type factorizeRequest struct {
	Matrix [][]float64 `json:"matrix"`
}

type statsDTO struct {
	Max     float64 `json:"max"`
	Min     float64 `json:"min"`
	Average float64 `json:"average"`
	Sum     float64 `json:"sum"`
	Count   int     `json:"count"`
}

type perMatrixDTO struct {
	Name       string  `json:"name"`
	Max        float64 `json:"max"`
	Min        float64 `json:"min"`
	Average    float64 `json:"average"`
	Sum        float64 `json:"sum"`
	Count      int     `json:"count"`
	IsDiagonal bool    `json:"isDiagonal"`
}

type statisticsDTO struct {
	Global      statsDTO       `json:"global"`
	PerMatrix   []perMatrixDTO `json:"perMatrix"`
	AnyDiagonal bool           `json:"anyDiagonal"`
}

// factorizeResponse is the 200 body of POST /api/v1/factorizations.
type factorizeResponse struct {
	Q          [][]float64   `json:"q"`
	R          [][]float64   `json:"r"`
	Statistics statisticsDTO `json:"statistics"`
}
