package api

type Response[T any] struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    T      `json:"data,omitempty"`
}

func Success[T any](message string, data T) Response[T] {
	return Response[T]{
		Status:  true,
		Message: message,
		Data:    data,
	}
}

func Error(message string) Response[any] {
	return Response[any]{
		Status:  false,
		Message: message,
	}
}
