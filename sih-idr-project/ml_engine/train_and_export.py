import torch
import torch.nn as nn
import torch.onnx

class SpeedPredictor(nn.Module):
    def __init__(self):
        super(SpeedPredictor, self).__init__()
        self.conv1 = nn.Conv1d(in_channels=6, out_channels=32, kernel_size=3, padding=1)
        self.relu = nn.ReLU()
        self.lstm = nn.LSTM(input_size=32, hidden_size=64, num_layers=1, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(128, 1)

    def forward(self, x):
        x = self.relu(self.conv1(x))
        x = x.transpose(1, 2)
        out, _ = self.lstm(x)
        speed = self.fc(out[:, -1, :])
        return speed

if __name__ == "__main__":
    print("Initializing model architecture...")
    model = SpeedPredictor()
    model.eval()

    dummy_input = torch.randn(1, 6, 10)
    output_path = "speed_predictor.onnx"

    print("Exporting clean ONNX binary...")
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=18,
        do_constant_folding=True,
        input_names=['imu_input'],
        output_names=['predicted_speed'],
        dynamic_axes={'imu_input': {0: 'batch_size'}, 'predicted_speed': {0: 'batch_size'}},
        dynamo=False
    )

    print(f"SUCCESS: Exported {output_path}")