import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Modal } from 'antd';
import './Equipment.css';

const { Option } = Select;

const EquipmentForm = ({ visible, onCancel, onSubmit, initialValues, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    } else if (!visible) {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <Modal
      title={initialValues ? 'Edit Equipment' : 'Add Equipment'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      className="dark-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="equipment-form"
      >
        <Form.Item
          name="name"
          label="Equipment Name"
          rules={[{ required: true, message: 'Please enter equipment name' }]}
        >
          <Input placeholder="e.g. Pump A-1" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Equipment Type"
          rules={[{ required: true, message: 'Please select equipment type' }]}
        >
          <Select placeholder="Select Type">
            <Option value="Motor">Motor</Option>
            <Option value="Pump">Pump</Option>
            <Option value="Compressor">Compressor</Option>
            <Option value="Conveyor">Conveyor</Option>
            <Option value="Fan">Fan</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="serialNumber"
          label="Serial Number"
        >
          <Input placeholder="e.g. SN-12345" />
        </Form.Item>

        <Form.Item
          name="location"
          label="Location"
          rules={[{ required: true, message: 'Please enter location' }]}
        >
          <Input placeholder="e.g. Building 2, Floor 1" />
        </Form.Item>

        <Form.Item
          name="department"
          label="Department"
        >
          <Input placeholder="e.g. Maintenance" />
        </Form.Item>

        <div className="form-actions">
          <Button onClick={onCancel} style={{ marginRight: 8 }}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? 'Update' : 'Create'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EquipmentForm;
