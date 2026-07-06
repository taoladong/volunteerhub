require "json"
require "sinatra/base"

require_relative "services/authenticator"
require_relative "services/csv_reports"
require_relative "services/database"

module VolunteerHub
  module ReportService
    class App < Sinatra::Base
      configure do
        set :bind, "0.0.0.0"
        set :port, ENV.fetch("PORT", "5005")
        set :show_exceptions, false
        set :protection, except: :json_csrf
      end

      before "/api/reports/*" do
        pass if public_report_endpoint?

        @current_user = Authenticator
          .new(request.env["HTTP_AUTHORIZATION"])
          .authenticate_admin!
      rescue Unauthorized => e
        halt_json 401, message: e.message
      rescue Forbidden => e
        halt_json 403, message: e.message
      end

      get "/health" do
        json_response(service: "RubyReportService", status: "ok")
      end

      get "/api/reports/health" do
        json_response(service: "RubyReportService", status: "ok")
      end

      get "/api/reports/ready" do
        Database.check!
        json_response(service: "RubyReportService", status: "ready")
      rescue StandardError => e
        halt_json 503, message: "Database is not ready", detail: e.message
      end

      get "/api/reports" do
        json_response(
          service: "RubyReportService",
          endpoints: [
            "/api/reports/summary",
            "/api/reports/events.csv",
            "/api/reports/donations.csv"
          ]
        )
      end

      get "/api/reports/summary" do
        json_response(CsvReports.new.summary)
      rescue StandardError => e
        halt_json 500, message: "Cannot build report summary", detail: e.message
      end

      get "/api/reports/events.csv" do
        csv_attachment(
          "volunteerhub-events-report.csv",
          CsvReports.new.events_csv(limit: safe_limit)
        )
      rescue StandardError => e
        halt_json 500, message: "Cannot export events report", detail: e.message
      end

      get "/api/reports/donations.csv" do
        csv_attachment(
          "volunteerhub-donations-report.csv",
          CsvReports.new.donations_csv(limit: safe_limit)
        )
      rescue StandardError => e
        halt_json 500, message: "Cannot export donations report", detail: e.message
      end

      error 404 do
        halt_json 404, message: "Report endpoint not found"
      end

      helpers do
        def public_report_endpoint?
          ["/api/reports/health", "/api/reports/ready"].include?(request.path_info)
        end

        def json_response(payload, status_code = 200)
          status status_code
          content_type :json
          JSON.generate(payload)
        end

        def halt_json(status_code, payload)
          halt status_code, json_response(payload, status_code)
        end

        def csv_attachment(filename, body)
          content_type "text/csv; charset=utf-8"
          attachment filename
          body
        end

        def safe_limit
          raw = params.fetch("limit", "1000").to_i
          [[raw, 1].max, 10_000].min
        end
      end
    end
  end
end
