all:
	#10.2.12.51
	make install
	make migration
	make build
	# make libs-build

seed:
	cp -R bin/seed/config dist/bin/seed
	cp .env dist/bin/seed
	cd dist/bin/seed && node seed.js

migration:
	cd libs/wallet-core && npm run typeorm migration:run

build:
	./node_modules/.bin/tsc -p tsconfig.build.json
	make deps
	make fix-bsc-web3

fix-bsc-web3:
	cp -f libs/worker-bsc/src/formatters.js dist/libs/worker-bsc/node_modules/web3-core-helpers/src/
	cp -f libs/worker-bsc/src/formatters.js dist/libs/worker-bsc/node_modules/web3-core-helpers/lib/

rebuild:
	rm -rf dist && ./node_modules/.bin/tsc -p tsconfig.build.json
	make deps

reinstall:
	make ts-deps-reinstall

install:
	make ts-deps

dep:
	cp -f $(t)/package.json dist/$(t)/
	cd dist/$(t) && rm -rf package-lock.json && npm i --force

deps:
	make dep t=libs/worker-common
	make dep t=libs/wallet-core
	make dep t=libs/worker-bsc
	make dep t=bin/bsc
	make dep t=bin/seed

ts-dep-reinstall:
	cd $(t) && rm -rf node_modules package-lock.json && npm i --force

ts-deps-reinstall:
	make ts-dep-reinstall t=./
	make ts-dep-reinstall t=libs/worker-common
	make ts-dep-reinstall t=libs/wallet-core
	make ts-dep-reinstall t=libs/worker-bsc
	make ts-dep-reinstall t=bin/bsc
	make ts-dep-reinstall t=bin/seed

ts-dep-install:
	cd $(t) && rm -rf package-lock.json node_modules dist && npm i --force

ts-deps:
	make ts-dep-install t=./
	make ts-dep-install t=libs/worker-common
	make ts-dep-install t=libs/wallet-core
	make ts-dep-install t=libs/worker-bsc
	make ts-dep-install t=bin/bsc
	make ts-dep-install t=bin/seed

lib-build:
	cd ${t} && rm -rf dist && npm run build

# Make sure other module that import these libs will not meet problems with package build
libs-build:
	make lib-build t=libs/worker-common
	make lib-build t=libs/wallet-core
	make lib-build t=libs/worker-bsc

clean-dep:
	rm -rf $(t)/node_modules
	rm -f $(t)/package-lock.json

clean-deps:
	make clean-dep t=libs/worker-common
	make clean-dep t=libs/wallet-core
	make clean-dep t=libs/worker-bsc



	
