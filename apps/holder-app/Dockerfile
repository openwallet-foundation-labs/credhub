FROM fholzer/nginx-brotli:v1.12.2
COPY dist/apps/holder-app/* /usr/share/nginx/html/
RUN echo "server {" > /etc/nginx/conf.d/default.conf && \
    echo "    listen 80;" >> /etc/nginx/conf.d/default.conf && \
    echo "    location / {" >> /etc/nginx/conf.d/default.conf && \
    echo "        root /usr/share/nginx/html;" >> /etc/nginx/conf.d/default.conf && \
    echo "        index index.html index.htm;" >> /etc/nginx/conf.d/default.conf && \
    echo "        try_files \$uri \$uri/ /index.html =404;" >> /etc/nginx/conf.d/default.conf && \
    echo "    }" >> /etc/nginx/conf.d/default.conf && \
    echo "}" >> /etc/nginx/conf.d/default.conf
RUN echo "brotli on;" >> /etc/nginx/nginx.conf && \
    echo "brotli_static on;" >> /etc/nginx/nginx.conf && \
    echo "brotli_types text/plain text/css application/javascript application/json image/svg+xml application/xml+rss;" >> /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
