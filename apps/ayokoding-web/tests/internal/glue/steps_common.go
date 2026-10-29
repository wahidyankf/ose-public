package glue

func (w *World) StepAppRunning() error {
	if w.handler == nil {
		return fail("handler is not built")
	}
	if err := w.get("/en"); err != nil {
		return err
	}
	return w.mustStatus(200)
}
