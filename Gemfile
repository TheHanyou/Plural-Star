source 'https://rubygems.org'

# You may use http://rbenv.org/ or https://rvm.io/ to install and use this version
ruby ">= 3.4.0"

# Exclude problematic versions of cocoapods and activesupport that causes build failures.
gem 'cocoapods', '>= 1.13', '!= 1.15.0', '!= 1.15.1'
gem 'activesupport', '>= 6.1.7.5', '!= 7.1.0'

# Ruby 3.4.0 has removed some libraries from the standard library.
gem 'bigdecimal'
gem 'logger'
gem 'benchmark'
gem 'mutex_m'

# Ruby 4.0 moved these from default to bundled gems — required for CocoaPods/pry internals.
gem 'ostruct'
gem 'pstore'
gem 'fiddle'
gem 'irb'
gem 'reline'
gem 'nkf'  # replaces kconv (removed in Ruby 3.4+) — required by CFPropertyList via xcodeproj
