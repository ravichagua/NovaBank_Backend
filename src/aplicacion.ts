
  // Público y de solo lectura (logo y afines para incrustar en correos)
  app.use("/assets", express.static(path.join(__dirname, "assets")));

  app.use(healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/dni", dniRouter);
  app.use("/api/verification", verificationRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/profile", profileRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
