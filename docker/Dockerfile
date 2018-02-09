FROM node:alpine
MAINTAINER Oleg Makarov <om@bankexfoundation.org>

RUN mkdir /oc_meta

WORKDIR /oc_meta

ADD /build /oc_meta/build
ADD /config /oc_meta/config
ADD /public /oc_meta/public
ADD /server /oc_meta/server
ADD /tests /oc_meta/tests
ADD /package.json /oc_meta/package.json
ADD /node_modules /oc_meta/node_modules
RUN mkdir /oc_meta/storage

EXPOSE 8080
