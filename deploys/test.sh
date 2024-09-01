#!/bin/bash
# this script is used to test the .env.example files and if the containers can start healthy with the provided configuration. It does not execute tests.
folders=("keycloak" "holder" "issuer" "verifier")

for folder in "${folders[@]}"; do
  echo "Processing folder: $folder"
  cd $folder
  cp .env.example .env
  docker compose up -d
  echo "Waiting for containers to be healthy in $folder..."

  check_health() {
    containers=$(docker compose ps -q)
    for container in $containers; do
      health_status=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "unhealthy")
      if [ "$health_status" != "healthy" ]; then
        return 1
      fi
    done
    return 0
  }

  for i in {1..4}; do
    if check_health; then
      echo "All containers in $folder are healthy."
      docker compose down
      break
    fi
    echo "Waiting for containers to be healthy in $folder... ($i/3)"
    sleep 5
  done

  if ! check_health; then
    echo "Containers in $folder did not become healthy in time."
    # print the logs to help debug
    docker compose logs
    exit 1
  fi

  cd ..
done

echo "All containers in all folders are healthy."
