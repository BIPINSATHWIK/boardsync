const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });

  if (!result.success) {
    const fields = {};
    const issues = result.error?.issues ?? result.error?.errors ?? [];
    issues.forEach((e) => {
      const key = e.path.slice(1).join('.');
      if (key) fields[key] = e.message;
    });
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.fields = fields;
    return next(err);
  }

  req.body = result.data.body ?? req.body;
  req.params = result.data.params ?? req.params;
  req.query = result.data.query ?? req.query;
  next();
};

module.exports = validate;
