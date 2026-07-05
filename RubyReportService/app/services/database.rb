require "tiny_tds"

module VolunteerHub
  module ReportService
    class Database
      CONNECTION_ENV_KEYS = [
        "REPORT_DATABASE_URL",
        "ConnectionStrings__ConnectedDb",
        "ConnectionStrings:ConnectedDb",
        "CONNECTED_DB",
        "DATABASE_URL"
      ].freeze

      class << self
        def with_client
          client = TinyTds::Client.new(connection_options)
          yield client
        ensure
          client&.close
        end

        def check!
          with_client do |client|
            client.execute("SELECT 1 AS ok").each.first
          end
        end

        private

        def connection_options
          config = parse_connection_string(connection_string)

          server = option(config, "server", "data source", "addr", "address", "network address") || "localhost"
          host, port = split_server(normalize_server(server))
          username = option(config, "user id", "uid", "user", "username")
          password = option(config, "password", "pwd")

          if username.to_s.empty? && enabled?(option(config, "integrated security", "trusted_connection", "trusted connection"))
            raise ArgumentError, "RubyReportService uses TinyTDS and needs SQL auth over TCP. Set ConnectionStrings__ConnectedDb to Server=localhost,1433;Database=VolunteerHub;User Id=volunteerhub_report;Password=YourStrongPassword123!;TrustServerCertificate=true;Encrypt=false"
          end

          {
            username: username || "sa",
            password: password || "",
            host: host,
            port: Integer(port || option(config, "port") || 1433),
            database: option(config, "database", "initial catalog") || "VolunteerHub",
            tds_version: ENV.fetch("TDS_VERSION", "7.4"),
            login_timeout: Integer(ENV.fetch("DB_LOGIN_TIMEOUT", 5)),
            timeout: Integer(ENV.fetch("DB_TIMEOUT", 15)),
            appname: "RubyReportService"
          }
        end

        def connection_string
          CONNECTION_ENV_KEYS.each do |key|
            value = ENV[key]
            return value unless value.to_s.strip.empty?
          end

          default_connection_string
        end

        def default_connection_string
          "Server=localhost,1433;Database=VolunteerHub;User Id=volunteerhub_report;Password=YourStrongPassword123!;TrustServerCertificate=true;Encrypt=false"
        end

        def parse_connection_string(value)
          value
            .to_s
            .split(";")
            .filter_map do |part|
              key, raw = part.split("=", 2)
              next if key.nil? || raw.nil?

              [key.strip.downcase, raw.strip]
            end
            .to_h
        end

        def option(config, *keys)
          keys.each do |key|
            value = config[key.downcase]
            return value unless value.to_s.empty?
          end

          nil
        end

        def enabled?(value)
          %w[true yes y 1 sspi].include?(value.to_s.strip.downcase)
        end

        def normalize_server(server)
          normalized = server.to_s.strip.sub(/\Atcp:/i, "")

          if normalized.match?(/\A\(localdb\)/i) || normalized.include?("\\")
            raise ArgumentError, "RubyReportService cannot connect to LocalDB or named SQL instances through TinyTDS. Use a TCP endpoint such as Server=localhost,1433 or Server=sqlserver,1433"
          end

          normalized
        end

        def split_server(server)
          return server.split(",", 2) if server.include?(",")
          return server.split(":", 2) if server.match?(/\A[^:]+:\d+\z/)

          [server, nil]
        end
      end
    end
  end
end
