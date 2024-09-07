FROM salesforce/cli:latest-full

ENV DEBIAN_FRONTEND=noninteractive

RUN npm install --global vlocity
RUN echo "y" | sf plugins install sf-orgdevmode-builds
RUN sf plugins install @salesforce/sfdx-scanner@latest

RUN npm config set @omnistudio:registry https://repo.vlocity.com/repository/vlocity-public/
RUN npm config set @vlocity-cme:registry https://repo.vlocity.com/repository/vlocity-public/

RUN mkdir -p -m 755 /etc/apt/keyrings \
  && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt update \
  && apt install gh -y

RUN apt-get autoremove --assume-yes \
  && apt-get clean --assume-yes \
  && rm -rf /var/lib/apt/lists/*

ENV SFDX_CONTAINER_MODE true
ENV DEBIAN_FRONTEND=dialog
ENV SHELL /bin/bash
