// Generic request-body validator. Usage: router.post("/x", validate(schema), controller)
// If validation fails, the controller never runs — the request is rejected
// right here with a consistent { success: false, message } shape, matching
// every other error response in this app.
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const firstIssue = result.error.issues[0];
        return res.json({ success: false, message: firstIssue.message });
    }

    // Replace req.body with the parsed/validated data — trims strings,
    // applies defaults, and strips any unexpected extra fields the
    // schema didn't define.
    req.body = result.data;
    next();
};

export default validate;