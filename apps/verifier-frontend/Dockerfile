FROM docker.io/nginx:stable-alpine
COPY dist/apps/verifier-frontend/* /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
