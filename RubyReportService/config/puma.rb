port ENV.fetch("PORT", 8080)
environment ENV.fetch("RACK_ENV", "development")
worker_count = Integer(ENV.fetch("WEB_CONCURRENCY", 0))
workers worker_count if worker_count.positive?
threads_count = Integer(ENV.fetch("RAILS_MAX_THREADS", 5))
threads threads_count, threads_count
preload_app! if worker_count.positive?
