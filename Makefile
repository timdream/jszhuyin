-include local.mk

# Make data files by pulling files from McBopomofo
data/database.data:
	@npm run grunt data
