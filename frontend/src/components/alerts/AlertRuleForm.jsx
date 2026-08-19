import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Switch, Modal } from 'antd';

const { Option } = Select;

const AlertRuleForm = ({ visible, onCancel, onSubmit, initialValues, loading, sensors = [] }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    } else if (!visible) {
      form.resetFields();
      form.setFieldsValue({ active: true, cooldown: 15 });
    }
  }, [visible, initialValues, form]);

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <Modal
      title={initialValues ? 'Edit Alert Rule' : 'Create Alert Rule'}
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
        initialValues={{ active: true, cooldown: 15 }}
      >
        <Form.Item
          name="name"
          label="Rule Name"
          rules={[{ required: true, message: 'Please enter rule name' }]}
        >
          <Input placeholder="e.g. High Temp Warning" />
        </Form.Item>

        <Form.Item
          name="sensorType"
          label="Sensor Type"
          rules={[{ required: true }]}
        >
          <Select placeholder="Select Sensor Type">
            <Option value="Temperature">Temperature</Option>
            <Option value="Vibration">Vibration</Option>
            <Option value="Pressure">Pressure</Option>
            <Option value="Current">Current</Option>
          </Select>
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="condition"
            label="Condition"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select>
              <Option value=">">Greater than</Option>
              <Option value="<">Less than</Option>
              <Option value="==">Equals</Option>
              <Option value=">=">Greater or eq</Option>
              <Option value="<=">Less or eq</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="threshold"
            label="Threshold"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="severity"
            label="Severity"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select>
              <Option value="critical">Critical</Option>
              <Option value="warning">Warning</Option>
              <Option value="info">Info</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="cooldown"
            label="Cooldown (mins)"
            style={{ flex: 1 }}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item
          name="active"
          label="Active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? 'Update' : 'Create'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AlertRuleForm;
