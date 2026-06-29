package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const (
	baseURL      = "https://sandbox.nomba.com/v1"
	clientID     = "706df6c4-b8bb-4130-88c4-d21b052f8631"
	clientSecret = "k8UobYk3APgOoxUnNL7VpuxzwTsH4LsXtydfjcHs8RH0YISBB4OMqJsaafG+U8fWETu9YZ96bNXE+DelCDuMPw=="
	accountID    = "f666ef9b-888e-4799-85ce-acb505b28023"
)

func getToken() (string, error) {
	body, _ := json.Marshal(map[string]string{
		"grant_type":    "client_credentials",
		"client_id":     clientID,
		"client_secret": clientSecret,
	})

	req, _ := http.NewRequest("POST", baseURL+"/auth/token/issue", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("accountId", accountID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result map[string]any
	json.NewDecoder(resp.Body).Decode(&result)

	data := result["data"].(map[string]any)
	return data["access_token"].(string), nil
}

func listVirtualAccounts(token string) {
	req, _ := http.NewRequest("GET", baseURL+"/accounts/virtual", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("accountId", accountID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}

func main() {
	_, err := getToken()
	if err != nil {
		fmt.Println("Token error:", err)
		return
	}
	fmt.Println("Token obtained successfully")
	filterVAPublic()
}

func filterVirtualAccounts(token string) {
	body, _ := json.Marshal(map[string]any{
		"accountName": "n",
		"accountRef":  "n",
	})

	req, _ := http.NewRequest("POST", baseURL+"/accounts/virtual/filter", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("accountId", accountID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body2, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body2))
}

func createVAPublic() {
	body, _ := json.Marshal(map[string]any{
		"accountRef":  "paye_test_001",
		"accountName": "Thompson Oretan",
		"currency":    "NGN",
	})

	req, _ := http.NewRequest("POST", "https://sandbox.nomba.com/v1/accounts/virtual", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body2, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body2))
}

func getVAPublic() {
	req, _ := http.NewRequest("GET", "https://sandbox.nomba.com/v1/accounts/virtual/paye_test_001", nil)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}

func filterVAPublic() {
	body, _ := json.Marshal(map[string]any{
		"accountRef": "paye_test_001",
	})

	req, _ := http.NewRequest("POST", "https://sandbox.nomba.com/v1/accounts/virtual/filter", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	b, _ := io.ReadAll(resp.Body)
	fmt.Println(string(b))
}
