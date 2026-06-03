package paye

import "github.com/ttomsin/paye/internal/features/providers"

type Client struct {
	// a map to hold providers
	providers map[string]providers.Provider
}

func NewClient() *Client {
	return &Client{
		providers: make(map[string]providers.Provider),
	}
}

// register provider
func (c *Client) RegisterProvider(provider providers.Provider) {
	c.providers[provider.Name()] = provider
}

// get provider
func (c *Client) GiveMe(name string) (providers.Provider, bool) {
	provider, ok := c.providers[name]
	return provider, ok
}
