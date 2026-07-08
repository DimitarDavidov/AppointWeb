namespace AppointWeb.Api.Models;

public static class ServiceCategories
{
    public const string HealthcareAndDental = "Healthcare & Dental";
    public const string SportsAndFitness = "Sports & Fitness";
    public const string BeautyAndWellness = "Beauty & Wellness";
    public const string ClassesAndCoaching = "Classes & Coaching";
    public const string Other = "Other";

    public static readonly string[] All =
    [
        HealthcareAndDental,
        SportsAndFitness,
        BeautyAndWellness,
        ClassesAndCoaching,
        Other,
    ];

    public static bool IsValid(string? category) =>
        !string.IsNullOrWhiteSpace(category) &&
        All.Contains(category.Trim(), StringComparer.Ordinal);
}
