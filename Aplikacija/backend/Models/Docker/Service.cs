namespace backend.Models.Docker;

public enum ServiceType
{
    Tcp,
    Udp
}

public class Service
{
    public ushort PortIn { get; set; }
    public ushort PortOut { get; set; }
    public ServiceType Type { get; set; }
}