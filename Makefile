-include local.mk

GIT?=git
MC_BOPOMOFO_REPO?=git://github.com/mjhsieh/McBopomofo.git

# get a copy of SpiderMonkey Javascript Shell for the js command
# http://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/latest-trunk/
# (scroll all the way down to find jsshell-x.zip for your platform)
JSSHELL?=js

# Make data files by pulling files from McBopomofo
.PHONY: data
data:
	@echo Pulling McBopomofo...
	@rm -rf $(TMPDIR)/McBopomofo
	@$(GIT) clone --depth=1 $(MC_BOPOMOFO_REPO) $(TMPDIR)/McBopomofo
	@echo
	@echo Generate data.txt...
	@$(MAKE) -C $(TMPDIR)/McBopomofo/Source/Data data.txt
	@echo
	@echo Convert data.txt to JSON...
	@cat $(TMPDIR)/McBopomofo/Source/Data/data.txt | \
		$(JSSHELL) -U ./build/convert-data.js words > ./lib/words.json
	@cat $(TMPDIR)/McBopomofo/Source/Data/data.txt | \
		$(JSSHELL) -U ./build/convert-data.js phrases > ./lib/phrases.json
	@echo
	@echo Cleaning up...
	@rm -rf $(TMPDIR)/McBopomofo
