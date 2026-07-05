# RubyReportService

RubyReportService la microservice Ruby/Sinatra dung de xuat bao cao CSV cho VolunteerHub.

## Endpoints

Health khong can token:

```text
GET /health
GET /api/reports/health
GET /api/reports/ready
```

Report can JWT role `Admin`:

```text
GET /api/reports
GET /api/reports/summary
GET /api/reports/events.csv?limit=1000
GET /api/reports/donations.csv?limit=1000
```

Qua ApiGateway local:

```text
http://localhost:5000/api/reports/events.csv
```

## Local dev

```bash
cd RubyReportService
bundle install
set ConnectionStrings__ConnectedDb=Server=localhost,1433;Database=VolunteerHub;User Id=volunteerhub_report;Password=YourStrongPassword123!;TrustServerCertificate=true;Encrypt=false
set JWT_SECRET=your_jwt_secret
set PORT=5005
bundle exec puma -C config/puma.rb
```

RubyReportService dung TinyTDS nen can SQL Server TCP va SQL auth. Connection string LocalDB hoac named instance `OHMYGOD\HOSYVINH` trong appsettings cua cac .NET service khong dung truc tiep cho Ruby duoc; hay dung endpoint TCP `Server=localhost,1433`.

SQL login local goi y:

```sql
USE master;
CREATE LOGIN volunteerhub_report WITH PASSWORD = 'YourStrongPassword123!';

USE VolunteerHub;
CREATE USER volunteerhub_report FOR LOGIN volunteerhub_report;
ALTER ROLE db_datareader ADD MEMBER volunteerhub_report;
```

## Docker

Service duoc gan vao `docker-compose.yml` va `docker-compose.nginx.yml` voi ten container `reportservice`.
