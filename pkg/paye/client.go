package paye

import "github.com/ttomsin/paye/internal/providers"

type Client struct {
	// a map to hold providers
	providers map[string]provider.Provider
}

func NewClient() *Client {
	return &Client{
		providers: make(map[string]provider.Provider),
	}
}

// register provider
func (c *Client) RegisterProvider(provider provider.Provider) {
	c.providers[provider.Name()] = provider
}

// get provider
func (c *Client) GiveMe(name string) (provider.Provider, bool) {
	provider, ok := c.providers[name]
	return provider, ok
}
