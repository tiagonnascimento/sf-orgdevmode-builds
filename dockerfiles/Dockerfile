FROM heroku/heroku:20

ENV DEBIAN_FRONTEND=noninteractive
ARG SALESFORCE_CLI_VERSION=nightly
# this will typically be nightly
ARG SF_CLI_VERSION=latest

RUN echo 'b298a73a9fc07badfa9e4a2e86ed48824fc9201327cdc43e3f3f58b273c535e7  ./nodejs.tar.gz' > node-file-lock.sha \
  && curl -s -o nodejs.tar.gz https://nodejs.org/dist/v18.15.0/node-v18.15.0-linux-x64.tar.gz \
  && shasum --check node-file-lock.sha
RUN mkdir /usr/local/lib/nodejs \
  && tar xf nodejs.tar.gz -C /usr/local/lib/nodejs/ --strip-components 1 \
  && rm nodejs.tar.gz node-file-lock.sha

ENV PATH=/usr/local/lib/nodejs/bin:$PATH
RUN npm install --global @salesforce/cli@${SF_CLI_VERSION}
RUN npm install --global vlocity
RUN echo "y" | sf plugins install sf-orgdevmode-builds

RUN npm config set @omnistudio:registry https://repo.vlocity.com/repository/vlocity-public/
RUN npm config set @vlocity-cme:registry https://repo.vlocity.com/repository/vlocity-public/

RUN mkdir -p -m 755 /etc/apt/keyrings \
  && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt update \
  && apt install gh -y

RUN apt-get update && apt-get install --assume-yes openjdk-11-jdk-headless jq
RUN apt-get autoremove --assume-yes \
  && apt-get clean --assume-yes \
  && rm -rf /var/lib/apt/lists/*

ENV SFDX_CONTAINER_MODE true
ENV DEBIAN_FRONTEND=dialog
ENV SHELL /bin/bash
