using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Common.IdentityManager.Models
{
    public class ApplicationUser : IdentityUser
    {
        /// <summary>
        /// The user's first name.
        /// </summary>
        [MaxLength(50)]
        [PersonalData]
        public string FirstName { get; set; }

        /// <summary>
        /// The user's last name.
        /// </summary>
        [MaxLength(80)]
        [PersonalData]
        public string LastName { get; set; }

        public bool IsAdmin { get; set; }
        public bool IsActive { get; set; }

        /// <summary>
        /// The user's full name.
        /// </summary>
        [NotMapped]
        public string FullName
        {
            get
            {
                if (!string.IsNullOrWhiteSpace(FirstName) &&
                    !string.IsNullOrWhiteSpace(LastName))
                {
                    return $"{FirstName} {LastName}";
                }

                return string.Empty;
            }
        }
    }
}