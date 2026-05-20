exports.getAll = (Model, populateOptions = []) => async (req, res) => {
  try {
    let query = Model.find();
    if (populateOptions.length > 0) {
      populateOptions.forEach(opt => query = query.populate(opt));
    }
    const docs = await query.exec();
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getOne = (Model, populateOptions = []) => async (req, res) => {
  try {
    let query = Model.findById(req.params.id);
    if (populateOptions.length > 0) {
      populateOptions.forEach(opt => query = query.populate(opt));
    }
    const doc = await query.exec();
    if (!doc) return res.status(404).json({ success: false, message: 'Não encontrado' });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.create = (Model) => async (req, res) => {
  try {
    const doc = await Model.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = (Model) => async (req, res) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Não encontrado' });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = (Model) => async (req, res) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Não encontrado' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};