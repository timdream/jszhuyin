-include local.mk

# Make data files by pulling files from McBopomofo
.PHONY: data
data:
	@grunt data
