require "jwt"

module VolunteerHub
  module ReportService
    class Unauthorized < StandardError; end
    class Forbidden < StandardError; end

    class Authenticator
      ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      LEGACY_ROLE_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"
      ROLE_CLAIM_KEYS = [
        "role",
        "roles",
        "Role",
        "Roles",
        ROLE_CLAIM,
        LEGACY_ROLE_CLAIM
      ].freeze
      ADMIN_ROLE_VALUES = %w[admin administrator].freeze
      DEFAULT_SECRET = "YourSecretKeyForAuthenticationShouldBeLongEnough"

      def initialize(authorization_header)
        @authorization_header = authorization_header.to_s
      end

      def authenticate_admin!
        payload = decode_token
        roles = extract_roles(payload)

        return payload if admin_payload?(payload, roles)

        found_roles = roles.empty? ? "none" : roles.join(", ")
        raise Forbidden, "Admin role is required. Found roles: #{found_roles}. Please log out and log in again."
      end

      private

      def decode_token
        token = bearer_token
        raise Unauthorized, "Bearer token is missing" if token.empty?

        JWT.decode(token, jwt_secret, true, algorithm: "HS256").first
      rescue JWT::ExpiredSignature
        raise Unauthorized, "Bearer token has expired"
      rescue JWT::DecodeError => e
        raise Unauthorized, "Bearer token is invalid: #{e.message}"
      end

      def bearer_token
        match = @authorization_header.match(/\ABearer\s+(.+)\z/i)
        match ? match[1].strip : ""
      end

      def jwt_secret
        ENV["JWT_SECRET"] || ENV["Jwt__SecretKey"] || DEFAULT_SECRET
      end

      def extract_roles(payload)
        values = ROLE_CLAIM_KEYS
          .flat_map { |key| Array(payload[key]) }
          .compact

        values
          .flat_map { |value| role_values(value) }
          .map(&:strip)
          .reject(&:empty?)
      end

      def role_values(value)
        case value
        when Array
          value.flat_map { |item| role_values(item) }
        when Hash
          value.values.flat_map { |item| role_values(item) }
        else
          value.to_s.split(/[,\s]+/)
        end
      end

      def admin_payload?(payload, roles)
        return true if roles.any? { |role| admin_role?(role) }

        user_type = payload["userType"] || payload["UserType"] || payload["user_type"]
        user_type.to_s == "3"
      end

      def admin_role?(role)
        ADMIN_ROLE_VALUES.include?(role.to_s.strip.downcase)
      end
    end
  end
end
