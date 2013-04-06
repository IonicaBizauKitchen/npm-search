
# npm search

  The npm search server.

## Files

  - `query` command to test queries
  - `server` the REST API server
  - `index` index primer

## API

### GET /:query

  Perform a search with the given `:query` responding with
  an array of packages:

```json
GET /popover
[
  {
    "name": "prompt-popover",
    "description": "Popover prompt component",
    "dist-tags": {
      "latest": "0.0.1"
    },
    "maintainers": [
      {
        "name": "tjholowaychuk",
        "email": "tj@vision-media.ca"
      }
    ],
    "time": {
      "modified": "2013-01-10T16:41:14.413Z"
    },
    "versions": {
      "0.0.1": "latest"
    },
    "keywords": [
      "prompt",
      "popover",
      "ui"
    ]
  }
]
```

  Optionally you may specify which properties should be
  returned:

```json
GET /popover?only=name,description
[
  {
    "name": "prompt-popover",
    "description": "Popover prompt component"
  }
]
```

## License

  MIT
