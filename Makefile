RELEASE := Aicodes-Dashboard-v0-1-b126.dmg

upload-dmg:
	cp dist/mac/AI*.dmg ~/Aicodes/website/$(RELEASE)
	cd ~/Aicodes/website
	gsutil cp ./$(RELEASE) gs://www.ai.codes
	gsutil acl ch -u AllUsers:R gs://www.ai.codes/$(RELEASE)
	
