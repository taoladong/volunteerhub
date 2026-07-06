require "jwt"
require_relative "app/services/authenticator"

secret = "YourSecretKeyForAuthenticationShouldBeLongEnough"

# Test 1: with 'role' string
payload1 = { "role" => "Admin" }
token1 = JWT.encode(payload1, secret, "HS256")
begin
  puts "Test 1: #{VolunteerHub::ReportService::Authenticator.new("Bearer #{token1}").authenticate_admin!}"
rescue => e
  puts "Test 1 Failed: #{e.class} - #{e.message}"
end

# Test 2: with 'http...' string
payload2 = { "http://schemas.microsoft.com/ws/2008/06/identity/claims/role" => "Admin" }
token2 = JWT.encode(payload2, secret, "HS256")
begin
  puts "Test 2: #{VolunteerHub::ReportService::Authenticator.new("Bearer #{token2}").authenticate_admin!}"
rescue => e
  puts "Test 2 Failed: #{e.class} - #{e.message}"
end

# Test 3: what if C# encodes role differently?
payload3 = { "role" => ["Admin"] }
token3 = JWT.encode(payload3, secret, "HS256")
begin
  puts "Test 3: #{VolunteerHub::ReportService::Authenticator.new("Bearer #{token3}").authenticate_admin!}"
rescue => e
  puts "Test 3 Failed: #{e.class} - #{e.message}"
end
