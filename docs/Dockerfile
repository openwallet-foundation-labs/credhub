FROM docker.io/nginx:stable-alpine

# Install wget
RUN apk --no-cache add wget

COPY site/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
