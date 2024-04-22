# Backend

## Database
The backend supports multiple types of databases. The type has to be set via the environment variable `DB_TYPE`. The following types are supported:

`postgres`: default database
If used, the following values have to be set:
```bash
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nestjs
DB_USERNAME=user
DB_PASSWORD=pass
```

`sqlite`
If used, the following values have to be set:
```bash
DB_TYPE=sqlite
DB_NAME=db.sqlite
```

There are no specific requirements for the used database, so using other types like `mysql` are possible to be added later.