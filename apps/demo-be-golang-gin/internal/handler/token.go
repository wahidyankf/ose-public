package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	contracts "github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/generated-contracts"
	"github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-golang-gin/internal/auth"
)

// TokenClaims handles GET /api/v1/tokens/claims.
func (h *Handler) TokenClaims(c *gin.Context) {
	claimsVal, _ := c.Get(string(auth.ClaimsKey))
	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	c.JSON(http.StatusOK, contracts.TokenClaims{
		Sub:   claims.Subject,
		Iss:   claims.Issuer,
		Roles: []string{string(claims.Role)},
		Exp:   int(claims.ExpiresAt.Unix()),
		Iat:   int(claims.IssuedAt.Unix()),
	})
}

// JWKS handles GET /.well-known/jwks.json.
func (h *Handler) JWKS(c *gin.Context) {
	raw := h.jwtSvc.JWKS()
	resp := contracts.JwksResponse{Keys: []contracts.JwkKey{}}
	if rawKeys, ok := raw["keys"].([]map[string]interface{}); ok {
		for _, k := range rawKeys {
			key := contracts.JwkKey{}
			if v, ok := k["kty"].(string); ok {
				key.Kty = v
			}
			if v, ok := k["kid"].(string); ok {
				key.Kid = v
			}
			if v, ok := k["use"].(string); ok {
				key.Use = v
			}
			resp.Keys = append(resp.Keys, key)
		}
	}
	c.JSON(http.StatusOK, resp)
}
